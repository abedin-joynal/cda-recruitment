const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');
const helper = require('../lib/helpers');
const _ = require("underscore");
const { hasPermission, complexPermissions } = require('../lib/permission');
const json2csv = require('json2csv').parse;

// const fields = ["name", "password", "con_password", "mobile", "emergency_mobile", "address", "staff_type_id"];
const fields = ["pc_id", "voter_name", "voter_details"];

router.get('/make-vote', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
},async (req, res) => {
    let posts = await getPosts();
    let candidates = await getCandidates();
    let postCandidates = await getPostCandidates();
    let votes = await getVotes();
    res.render('votes/make-vote', {data: null, posts : posts, candidates: candidates, postCandidates: postCandidates, votes: votes});
});

router.get('/save-vote', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
}, async (req, res) => {
    let pc_id = req.query.pc_id;
    let v_name = req.query.v_name;
    let v_details = req.query.v_details;

    let r = {};
    try {
        let save = await pool.query(`INSERT INTO c_votes SET pc_id = ?, voter_name = ?, voter_details = ?`, [pc_id, v_name, v_details]);
        r.status = true;
        r.insertid = save.insertId;
        let votes = await getVotes()
        universalEmitter.emit('vote-casted', votes);
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    res.send(r);
});

router.get('/get-vote-data', async (req, res) => {
    let votes = await getVotes();

    universalEmitter.once('vote-casted', async function(emit_data) {
        // let coach_id = emit_data[0].coach_id; 
        // console.log(emit_data)
        let r = {emitted_data: emit_data}
        res.send(r);
        res.end();
    });
    return;
});

router.get('/download-csv', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
},async (req, res) => {
    data = await getVotes();
    downloasAsCSV(data, res);
});

router.get('/get-all-votes', async (req, res) => {
    let r = {};
    try {
        let votes = await getVotes();
        r.status = true;
        r.votes = votes;
    } catch (err) {
        r.status = false;
    }
    res.send(r);
});

function getPosts() {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name, description FROM c_posts WHERE status = "1"');
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
}

function getCandidates() {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name, age, gender, pic FROM c_candidates WHERE status = "1"');
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
}

function getPostCandidates() {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, post_id, candidate_id FROM c_post_candidate WHERE status = "1"');
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
}

function getVotes() {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query(`SELECT v.id, v.voter_name, v.voter_details, 
                                        p.id post_id, p.name post_name, c.id candidate_id,
                                        c.name candidate_name, v.status, v.date_created 
                                        FROM c_votes v
                                        LEFT JOIN c_post_candidate pc ON v.pc_id = pc.id
                                        LEFT JOIN c_candidates c ON c.id = pc.candidate_id
                                        LEFT JOIN c_posts p ON p.id = pc.post_id ORDER BY v.id DESC`);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
}

function validate(req, op) {
    req.check('name', 'Name is required').notEmpty();
    req.check('mobile', 'Mobile Number must be a number of 11-12 digits').notEmpty().isNumeric().isLength({ min: 11, max: 12 });
    req.check('staff_type_id', 'Staff Type is required').notEmpty().isNumeric();
    req.check('emergency_mobile', 'Emergency Mobile Number must be a number').isNumeric();
    
    if(op == 'add') {
        req.check('password', 'Password is required').notEmpty();
        req.check('con_password', 'Confirm Password is required').notEmpty();
        if(req.body.password) {
            req.check('con_password','Passwords do not match.').equals(req.body.password);
        }
    }

    if(op == 'edit') {
        if(req.body.password) {
            req.check('con_password', 'Confirm Password is required').notEmpty();
            req.check('con_password','Passwords do not match.').equals(req.body.password);
        }
    }
    return req.validationErrors();
}

function downloasAsCSV(data, res) {
    const csvString = json2csv(data);
    res.setHeader('Content-disposition', 'attachment; filename=vote-list-report.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvString);
}

module.exports = router;