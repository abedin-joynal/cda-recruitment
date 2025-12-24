module.exports = {
    isLoggedIn (req, res, next) {
        // console.error(req.user)

        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/signin');
    }
};
