const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');
const helper = require('../lib/helpers');
const _ = require("underscore");
const operator = require("./operators");
const dbc = require('../models/common');
const auth = require('../lib/auth');

router.get('/getPosts', async (req, res) => {
    // operator.authenticateUser(user_id, token);
    let r = {statusCode: 200};
    try {
        user_id = req.query.user_id;
        token = req.query.token;
        let authenticated = await dbc.authenticateUser(user_id, token);
        if(authenticated) {
            let posts = await pool.query(`SElECT id, name, description FROM c_posts WHERE status = ? ORDER BY p_order ASC`, [1]);
            let posts_details = await pool.query(` SELECT post_id, count(id) applicant_count, (SELECT count(id) FROM applicants WHERE img IS NULL AND post_id = a.post_id) emptyImgCount from applicants a where a.status = 1 group by post_id `);
            let pending_post_count = await pool.query(` SELECT post_id, count(id) applicant_count from applicants a group by post_id`);
            r.data = posts;
            r.post_details = posts_details;
            r.status = true;
        } else {
            r.status = false;
            r.statusCode = 101;
            r.msg = `Invalid Authentication Token`;
        }
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    res.send(r);
});


module.exports = router;