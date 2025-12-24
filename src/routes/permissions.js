const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');

router.get('/add', (req, res) => {
    res.render('permissions/add', {data: null, form_data: req.session.form_data, msg: req.session.msg, errors: req.session.errors});
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/add', async (req, res) => {
    const { name } = req.body; 
    req.checkBody('name', 'This field is required').notEmpty();
    var errors = req.validationErrors();
    if(errors) {
        req.session.errors = errors;
        req.session.msg = false;
        req.session.form_data = req.body;
        res.redirect('/permissions/add/');
    } else {
        const data = { name };
        data.date_created = moment().format('YYYY-MM-DD hh:mm:ss')
        await pool.query('INSERT INTO acl_permissions set ?', [data]);
        req.session.msg = "<i class='fas fa-check-circle'></i> Permission was created successfully";
        res.redirect('/permissions');
    }
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM acl_permissions WHERE id = ?', [id]);
    req.session.msg = "<i class='fas fa-check-circle'></i> Permission were removed successfully";
    res.redirect('/permissions');
});

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    let data = await pool.query('SELECT * FROM acl_permissions WHERE id = ?', [id]);
    res.render('permissions/edit', {data: data[0], msg: req.session.msg, errors: req.session.errors, form_data: req.session.form_data });
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body; 
    req.checkBody('name', 'Permission Name is required').notEmpty();
    var errors = req.validationErrors();
    if(errors) {
        req.session.errors = errors;
        req.session.msg = false;
        req.session.form_data = req.body;
        res.redirect('/permissions/edit/' + id);
    } else {
        const data = { name };
        data.date_modified = moment().format('YYYY-MM-DD hh:mm:ss')
        await pool.query('UPDATE acl_permissions set ? WHERE id = ?', [data, id]);
        req.session.msg = "<i class='fas fa-check-circle'></i> Permission Information were updated successfully";
        res.redirect('/permissions');
    }
});

router.get('/:page?/:offset?/:search?', isLoggedIn, async (req, res) => {
    let { page } = req.params;
    let { offset } = req.params;
    let { search } = req.params;
    page = page ? page : 1;
    if(offset) {
        offset = parseInt(offset); // page = 1;
    } else {
        offset = 5;
    }
    offset = offset ? parseInt(offset) : 5;
    let start = (page - 1) * offset;
    let permissions = null;
    let total_record = 0;
    if(search) {
        permissions = await pool.query("SELECT * FROM acl_permissions WHERE name Like ? ORDER BY name ASC LIMIT ?, ? ", ["%"+search+"%", start, offset]);
        total_record = await pool.query('SELECT count(id) as count FROM acl_permissions WHERE name Like ? ORDER BY name ASC', ["%"+search+"%"]);
    } else {
        search = null;
        permissions = await pool.query('SELECT * FROM acl_permissions LIMIT ?, ?', [start, offset]);
        total_record = await pool.query('SELECT count(id) as count FROM acl_permissions');
    }
    total_record = total_record[0].count;
    let total_page = Math.ceil(total_record / offset);
    let start_index = parseInt(parseInt(page) - 1) * parseInt(offset);
    res.render('permissions/list', { permissions : permissions, msg: req.session.msg, start_index: start_index, search: search, paginate : { total_page : total_page, page : page, offset : offset }});
    req.session.msg = false;
});

module.exports = router;