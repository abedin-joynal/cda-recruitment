const express = require('express');
const router = express.Router();
const moment = require('moment');

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const { hasPermission, complexPermissions } = require('../lib/permission');

router.get('/', async (req, res) => {
    // let dates = getDates();
    res.render('dashboard/dashboard', { layout: 'public_main.hbs', data: null});
});

router.get('/dash', (req, res, next) => {
    hasPermission(req, res, next, 'vote-edit');
}, (req, res, next) => {
    // let dates = getDates();
    res.render('dashboard/dashboard', { data: null});
    // res.render('dashboard/dashboard', { layout: 'public_main.hbs', data: null});

});


module.exports = router;