const express = require('express');
const router = express.Router();

const passport = require('passport');
const { isLoggedIn } = require('../lib/auth');

// SIGNUP
router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/profile',
  failureRedirect: '/signup',
  failureFlash: true
}));

// SINGIN
router.get('/signin', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dash');
    return;
  }
  console.log("Errors: " + req.session.errors);
  res.render('auth/signin', {msg: req.session.msg, errors: req.session.errors, form_data: req.session.form_data});
  req.session.errors = null;
  req.session.form_data = null;
  req.session.msg = null;
});

router.post('/signin', (req, res, next) => {
  req.checkBody('username', 'User Name is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  var errors = req.validationErrors();
  console.log('Login attempt - Errors:', errors);
  console.log('Login attempt - Protocol:', req.protocol);
  console.log('Login attempt - Secure:', req.secure);
  console.log('Login attempt - Headers:', req.headers['x-forwarded-proto']);
  
  if(errors) {
      req.session.errors = errors;
      req.session.msg = false;
      req.session.form_data = req.body;
      res.redirect('/signin');
  } else {
    passport.authenticate('local.signin', {
      successRedirect: '/dash',
      failureRedirect: '/signin',
      failureFlash: true
    } )(req, res, next);
  }
  return;
  // req.check('username', 'Username is Required').notEmpty();
  // req.check('password', 'Password is Required').notEmpty();
  // const errors = req.validationErrors();
  // if (errors.length > 0) {
  //   req.flash('message', errors[0].msg);
  //   res.redirect('/signin');
  // }
  // passport.authenticate('local.signin', {
  //   successRedirect: '/profile',
  //   failureRedirect: '/signin',
  //   failureFlash: true
  // })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/signin');
});

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile');
});

module.exports = router;
