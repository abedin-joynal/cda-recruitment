const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');
const helper = require('../lib/helpers');
const dbc = require('../models/common');
const { hasPermission, complexPermissions } = require('../lib/permission');
const json2csv = require('json2csv').parse;

router.get('/', async (req, res) => {
    let posts = await getPosts();
    let candidates = await getCandidates();
    res.render('candidates/index', {data: null, posts : posts, candidates: candidates});
});

router.get('/all', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
}, async (req, res) => {
    let r = {};
    try {
        r.data = await getCandidates();
        r.status = true;
    } catch (err) {
        r.status = false;
    }
    res.send(r)
});

router.get('/save', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
}, async (req, res) => {
    let action = req.query.action;
    let p_id = req.query.p_id;
    let c_name = req.query.c_name;
    let c_age = req.query.c_age;
    let c_gender = req.query.c_gender;
    let c_id = req.query.c_id;
    let pc_id = req.query.pc_id;

    let r = {};
    try {
        if(action == 'new') {
            let save = await pool.query(`INSERT INTO c_candidates SET name = ?, age = ?, gender	= ?`, [c_name, c_age, c_gender]);
            let savepc = await pool.query(`INSERT INTO c_post_candidate SET post_id = ?, candidate_id = ?`, [p_id, save.insertId]);
            r.insertid = save.insertId;
        } else {
            let save = await pool.query(`UPDATE c_candidates SET name = ?, age = ?, gender	= ? WHERE id = ?`, [c_name, c_age, c_gender, c_id]);
            let savepc = await pool.query(`UPDATE c_post_candidate SET post_id = ?  WHERE id = ?`, [p_id, pc_id]);
        }
        r.status = true;
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    res.send(r);
});

router.get('/delete', async (req, res) => {
    let r = {};
    try {
        let c_id = req.query.c_id;
        let pc_id = req.query.pc_id;
        await pool.query('UPDATE c_candidates SET status = 0 WHERE id = ?', [c_id]);
        await pool.query('UPDATE c_post_candidate SET status = 0 WHERE id = ?', [pc_id]);
        r.status = true;
    } catch (err) {
        r.status = false;
    }
    res.send(r);
});

router.get('/download-csv', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
},async (req, res) => {
    data = await getCandidates();
    downloasAsCSV(data, res);
});


function getCurrentDate() {
    return moment().format('DD-MM-YYYY');
}

async function getPosts() {
    try {
        result = await pool.query('SELECT id, name FROM c_posts WHERE status = "1"');
    } catch (err) {
        result = null;
    }
    return result;
}

async function getCandidates() {
    try {
        result = await pool.query(`SELECT c.id c_id, c.name c_name, age, gender, pic, p.id post_id, p.name p_name, pc.id pc_id
                                    FROM c_candidates c 
                                    LEFT JOIN c_post_candidate pc ON pc.candidate_id = c.id
                                    LEFT JOIN c_posts p ON pc.post_id = p.id    
                                    WHERE c.status = 1 & p.status = 1 AND pc.status = 1 ORDER BY c.id DESC`);
    } catch (err) {
        result = null;
    }
    return result;
}

function downloasAsCSV(data, res) {
    const csvString = json2csv(data);
    res.setHeader('Content-disposition', 'attachment; filename=candidate-list-report.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvString);
}

module.exports = router;