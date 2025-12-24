const express = require('express');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');
const _ = require("underscore");

passport.use('local.signin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM c_users WHERE username = ?', [username]);
  let error = {};
  if (rows.length > 0) {
    let user = rows[0];
    // user.permission = ["edit", "delete"]
    
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      error = null;
      req.session.errors = null;
      done(null, user, req.flash('success', 'Welcome ' + user.username));
    } else {
      error.msg = 'Incorrect Password';
      req.session.errors = {error};
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    error.msg = 'The Username does not exists';
    req.session.errors = {error};
    return done(null, false, req.flash('message', 'The Username does not exists.'));
  }
}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {

  const { fullname } = req.body;
  let newUser = {
    fullname,
    username,
    password
  };
  newUser.password = await helpers.encryptPassword(password);
  // Saving in the Database
  const result = await pool.query('INSERT INTO c_users SET ? ', newUser);
  newUser.id = result.insertId;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM c_users WHERE id = ?', [id]);
  let permissions = await pool.query(`SELECT p.name FROM c_users AS u LEFT JOIN acl_user_role AS ur ON u.id = ur.user_id 
                                      LEFT JOIN acl_role_permission AS rp ON rp.role_id = ur.role_id 
                                      LEFT JOIN acl_permissions AS p ON p.id = rp.permission_id
                                      WHERE u.id = ?`, [id]);
  let perm = {};
  permissions.forEach(function (item, index) {
    perm[item.name] = true;
  });
  rows[0].permissions = perm;

  done(null, rows[0]);
});

