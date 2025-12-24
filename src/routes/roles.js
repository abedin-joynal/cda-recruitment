const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');

router.get('/add', async (req, res) => {
    let permissions = await pool.query('SELECT id, name FROM acl_permissions');
    res.render('roles/add', {data: null, permissions : permissions, form_data: req.session.form_data, msg: req.session.msg, errors: req.session.errors});
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/add', async (req, res) => {
    const { name } = req.body;
    const { permissions } = req.body;
    req.checkBody('name', 'This field is required').notEmpty();
    var errors = req.validationErrors();
    if(!permissions) {
        if(errors) {
            errors.push({ location: 'body', param: 'permissions', msg: 'Permissions is required', value: permissions });
        } else {
            errors = [{ location: 'body', param: 'permissions', msg: 'Permissions is required', value: permissions }];
        }
    }
    if(errors) {
        req.session.errors = errors;
        req.session.msg = false;
        req.session.form_data = req.body;
        res.redirect('/roles/add/');
    } else {
        const data = { name };
        data.date_created = moment().format('YYYY-MM-DD hh:mm:ss');
        let op_add_role = await pool.query('INSERT INTO acl_roles set ?', [data]);
        let role_id = op_add_role.insertId;
        Object.keys(permissions).forEach(async function(perm_id) {
            let date_created = moment().format('YYYY-MM-DD hh:mm:ss');
            await pool.query('INSERT INTO acl_role_permission SET role_id = ?, permission_id = ?, date_created = ?', [role_id, permissions[perm_id], date_created]);
        });
        req.session.msg = "<i class='fas fa-check-circle'></i> Role was created successfully";
        res.redirect('/roles');
    }
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM acl_roles WHERE id = ?', [id]);
    req.session.msg = "<i class='fas fa-check-circle'></i> Role were removed successfully";
    res.redirect('/roles');
});

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    let permissions = await pool.query('SELECT id, name FROM acl_permissions');
    let role_permission = await pool.query('SELECT permission_id FROM acl_role_permission WHERE role_id = ?', [id]);
    
    Object.keys(permissions).forEach(function(pkey) {
        let perm = permissions[pkey];
        perm.checked = "";
        if(req.session.form_data !== null && "permissions" in req.session.form_data) {
            Object.keys(req.session.form_data.permissions).forEach(function(rpkey) {
                let rp_id = req.session.form_data.permissions[rpkey];
                if(perm.id == rp_id) {
                    perm.checked = "checked"; return; 
                }
            });
        } else {
            Object.keys(role_permission).forEach(function(rpkey) {
                let rp_id = role_permission[rpkey].permission_id;
                if(perm.id == rp_id) {
                    perm.checked = "checked"; return; 
                }
            });
        }
    });
    let data = await pool.query('SELECT * FROM acl_roles WHERE id = ?', [id]);
    res.render('roles/edit', { data: data[0], permissions : permissions, role_permission : role_permission, msg: req.session.msg, errors: req.session.errors, form_data: req.session.form_data });
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const { permissions } = req.body;
    req.checkBody('name', 'Role Name is required').notEmpty();
    var errors = req.validationErrors();
    if(!permissions) { /* @TODO: validation */ 
        if(errors) {
            errors.push({ location: 'body', param: 'permissions', msg: 'Permissions is required', value: permissions });
        } else {
            errors = [{ location: 'body', param: 'permissions', msg: 'Permissions is required', value: permissions }];
        }
    }
    if(errors) { // [ { location: 'body', param: 'name', msg: 'Role Name is required', value: '' } ]
        req.session.errors = errors;
        req.session.msg = false;
        req.session.form_data = req.body;
        res.redirect('/roles/edit/' + id);
    } else {
        const data = { name };
        data.date_modified = moment().format('YYYY-MM-DD hh:mm:ss')
        await pool.query('UPDATE acl_roles set ? WHERE id = ?', [data, id]);
        await pool.query('DELETE FROM acl_role_permission WHERE role_id = ?', [id]);
        Object.keys(permissions).forEach(async function(perm_id) {
            let date_created = moment().format('YYYY-MM-DD hh:mm:ss');
            await pool.query('INSERT INTO acl_role_permission SET role_id = ?, permission_id = ?, date_created = ?', [id, permissions[perm_id], date_created]);
        });
        req.session.msg = "<i class='fas fa-check-circle'></i> Role Information were updated successfully";
        res.redirect('/roles');
    }
});

router.get('/:page?/:offset?/:search?', isLoggedIn, async (req, res) => {
    let { page } = req.params;
    let { offset } = req.params;
    let { search } = req.params;
    page = page ? page : 1;
    // console.log(page)
    if(offset) {
        offset = parseInt(offset); // page = 1;
    } else {
        offset = 5;
    }
    offset = offset ? parseInt(offset) : 5;
    let start = (page - 1) * offset;
    let roles = null;
    let total_record = 0;
    if(search) {
        roles = await pool.query("SELECT * FROM acl_roles WHERE name Like ? LIMIT ?, ?", ["%"+search+"%", start, offset]);
        total_record = await pool.query('SELECT count(id) as count FROM acl_roles WHERE name Like ?', ["%"+search+"%"]);
    } else {
        search = null;
        roles = await pool.query('SELECT * FROM acl_roles LIMIT ?, ?', [start, offset]);
        total_record = await pool.query('SELECT count(id) as count FROM acl_roles');
    }
    total_record = total_record[0].count;
    let total_page = Math.ceil(total_record / offset);
    let start_index = parseInt(parseInt(page) - 1) * parseInt(offset);
    // console.log(offset, page)
    res.render('roles/list', { roles : roles, msg: req.session.msg, start_index: start_index, search: search, paginate : { total_page : total_page, page : page, offset : offset }});
    req.session.msg = false;
});

module.exports = router;