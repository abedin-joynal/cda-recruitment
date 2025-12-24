const express = require('express');
const router = express.Router();
const pool = require('../database');
const { hasPermission } = require('../lib/permission');
const moment = require('moment');
const helper = require('../lib/helpers');
const dbc = require('../models/common');
const _ = require("underscore");

const fields = ["username", "fullname", "password", "con_password", "role_id", "company_id", "counter_id"];

/*@TODO: issue username duplicates while adding user as superadmin */

router.get('/add', (req, res, next) => {
        hasPermission(req, res, next, 'user-edit');
    }, async (req, res) => {
        let cur_user_company_id = req.user.company_id;
        let roles = await pool.query('SELECT * FROM acl_roles WHERE id != 1');
        let companies = await dbc.getCompanies();
        let counters = await dbc.getAssignedCompanyCounters(cur_user_company_id);
        res.render('users/add', {user: null, roles: roles, companies: companies, counters: counters, cur_user_company_id: cur_user_company_id,
                                form_data: req.session.form_data, msg: req.session.msg, errors: req.session.errors});
        req.session.errors = null;
        req.session.form_data = null;
        req.session.msg = null;
    }
);

router.post('/add', (req, res, next) => {
        hasPermission(req, res, next, 'user-edit');
    }, async (req, res) => {
        const { username, fullname, password, role_id, company_id, counter_id } = req.body; 
        let errors = await validate(req, "add");
        if(errors) {
            let form_data = helper.decorateFormFields(fields, errors, req.body, false);
            req.session.errors = errors;
            req.session.msg = false;
            req.session.form_data = form_data;
            res.redirect('/users/add/');
        } else {
            const data = { username, fullname };
            if(password) {
                data.password = await helper.encryptPassword(password)
            }
            data.counter_id = counter_id !== "" ? counter_id : null;
            data.company_id = company_id ? company_id : req.user.company_id;
            let op_add_user = await pool.query('INSERT INTO c_users set ?', [data]);
            let user_id = op_add_user.insertId;
            let date_created = moment().format('YYYY-MM-DD hh:mm:ss');
            let user_role = { user_id : user_id, role_id: role_id, date_created : date_created }
            try {
                await pool.query('DELETE FROM acl_user_role WHERE user_id = ?', [user_id]);
                await pool.query("INSERT INTO acl_user_role SET ?", user_role);
                req.session.msg = "<i class='fas fa-check-circle'></i> User Information were updated successfully";
                res.redirect('/users');
            } catch (err) {
                req.session.msg = err.sqlMessage;
                res.redirect('/users/add/');
            }
        }
        // req.session.errors = null;
        // req.session.form_data = null;
    }
);

router.get('/', (req, res, next) => {
    hasPermission(req, res, next, 'user-list');
  }, async (req, res) => {
    let company_id_flag = req.user.company_id == -1 ? 1 : 0;
    const users = await pool.query(`SELECT u.*, r.name AS role_name
                                    FROM c_users AS u 
                                    LEFT JOIN acl_user_role AS ur ON ur.user_id = u.id 
                                    LEFT JOIN acl_roles AS r ON ur.role_id = r.id
                                    WHERE u.id != 1`);
    // console.log(users)
    res.render('users/list', { users : users, msg: req.session.msg });
    req.session.msg = false;
});

router.get('/delete/:id', (req, res, next) => {
    hasPermission(req, res, next, 'user-delete');
  }, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM c_users WHERE id = ?', [id]);
    req.session.msg = "<i class='fas fa-check-circle'></i> User were removed successfully";
    res.redirect('/users');
});

router.get('/edit/:id', (req, res, next) => {
    hasPermission(req, res, next, 'user-edit');
  }, async (req, res) => {
    const { id } = req.params;
    let cur_user_company_id = req.user.company_id;
    const roles = await pool.query('SELECT * FROM acl_roles WHERE id != 1');
    const users = await pool.query(`SELECT u.id AS id, u.username AS username, u.fullname AS fullname, u.counter_id AS counter_id, u.company_id AS company_id,
                                    ur.role_id AS role_id 
                                    FROM c_users AS u 
                                    LEFT JOIN acl_user_role AS ur ON u.id = ur.user_id WHERE u.id = ?`, [id]);

    if(!req.session.errors) {
        req.session.form_data = helper.decorateFormFields(fields, false, false, users[0]);
    }
    res.render('users/edit', {user: users[0], roles : roles, cur_user_company_id: cur_user_company_id, 
        msg: req.session.msg, errors: req.session.errors, form_data: req.session.form_data });

    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/edit/:id', (req, res, next) => {
        hasPermission(req, res, next, 'user-edit');
    },async (req, res) => {
        const { id } = req.params;
        const { username, fullname, password, role_id} = req.body;
        var errors = await validate(req, "edit");
        if(errors) {
            let form_data = helper.decorateFormFields(fields, errors, req.body, false);
            req.session.errors = errors;
            req.session.msg = false;
            req.session.form_data = form_data;
            res.redirect(`/users/edit/${id}`);
        } else {
            const data = { username, fullname };
            if(password) {
                data.password = await helper.encryptPassword(password)
            }
            try {
                await pool.query('UPDATE c_users set ? WHERE id = ?', [data, id]);
                let date_modified = moment().format('YYYY-MM-DD hh:mm:ss');
                let user_role = { role_id: role_id, date_modified : date_modified }
                await pool.query('UPDATE acl_user_role set role_id = ?, date_modified = ? WHERE user_id = ?', [role_id, date_modified, id]);
                req.session.msg = "<i class='fas fa-check-circle'></i> User Information were updated successfully";
                res.redirect('/users');
            } catch(err) {
                req.session.msg = err.sqlMessage;
                res.redirect(`/users/edit/${id}`);
            }
        }
    }
);

router.post('/get-company-counters', async (req, res) => {
    let { company_id } = req.body; 
    let html = "";
    let counters = await dbc.getAssignedCompanyCounters(company_id);
    html = `<option value="">Select A Counter</option>`;
    _.each(counters, function(counter, index, list) {
        html += `<option value='${counter.id}'>${counter.name}</option>`;
    })
    res.end(html);
});


function doesExists(field, val, company_id) {
    let company_id_flag = company_id == -1 ? 1 : 0;
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            data = await pool.query(`SELECT count(id) as count FROM c_users WHERE ${field} = ? AND (company_id = ? OR 1 = ?)`, [val, company_id, company_id_flag]);
            result = data[0].count >= 1 ? true : false;
            resolve(result);
        } catch (err) {
            console.log(err);
            result = null;
        }
        resolve(result);
    });
}

async function validate(req, op) {
    req.checkBody('username', 'User Name is required').notEmpty();
    req.checkBody('fullname', 'Full Name is required').notEmpty();
    req.checkBody('role_id', 'Role is required').notEmpty();
    if(req.body.role_id == 4) {
        req.checkBody('counter_id', 'Counter is required').notEmpty();
    }
    if(op == 'add') {
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('con_password', 'Confirm Password is required').notEmpty();
        if(req.body.password) {
            req.checkBody('con_password','Passwords do not match.').equals(req.body.password);
        }
    }
    let err = req.validationErrors() ? req.validationErrors() : [];
    if(op == 'add') {
        let company_id = req.user.company_id;
        if(await doesExists('username', req.body.username, company_id)) err.push({param: 'username', msg : `This username (${req.body.username}) already exists`});
    }
    return (err.length == 0) ? false : err;
}

module.exports = router;