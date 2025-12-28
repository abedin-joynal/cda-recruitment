const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');
const helper = require('../lib/helpers');
const _ = require("underscore");
const dbc = require('../models/common');
const helpers = require('../lib/helpers');

const fields = ["name", "password", "con_password", "mobile", "emergency_mobile", "address", "staff_type_id"];
// let td = moment.duration(moment(date_created).diff(moment(getCurrentTime())));

router.post('/login', async (req, res) => {
    const { mobile, pwd } = req.body;
    let r = {};
    try {
        let q = await pool.query(`SELECT id, password, name, mobile, picture FROM c_operators s WHERE s.mobile = ? AND s.status = 1`, [mobile]);
        console.log(q)
        if(q.length == 1) {
            let validPassword = await helper.matchPassword(pwd, q[0].password);
            console.log(validPassword)
            if(validPassword) {
                let new_token = helpers.generateTrnxId();
                // AND token_created = '${moment().format('YYYY-MM-DD hh:mm:ss')}'
                let u = await pool.query(`UPDATE c_operators SET token = ?  WHERE id = ?`, [new_token, q[0].id]);
                r.id = q[0].id;
                r.name = q[0].name;
                r.mobile = q[0].mobile;
                r.picture = q[0].picture;
                r.token = new_token;
                // r.staff_type_id = q[0].staff_type_id;
                r.status = true;
                // console.log(r);
            } else {
                r.status = false;
            }
        } else {
            r.status = false;
        }
    } catch (err) {
        console.log(err);
        r.status = false;
    }
    res.send(r);
});

router.get('/', async (req, res) => {
    res.render('operators/landing', {layout: 'main_operators.hbs', data: null, form_data: req.session.form_data, msg: req.session.msg, errors: req.session.errors});
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

module.exports = router;
// module.exports = authenticateUser1;