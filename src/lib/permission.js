module.exports = {
    hasPermission (req, res, next, perm) {
        if (req.user && req.user.permissions[perm]) {
            return next();
        }
        return res.redirect('/signin');
    },

    complexPermissions (user) {
        let permissions = {};
        permissions.perm_booking = user.permissions['coach-seat-booking-full-control'] || user.permissions['coach-seat-booking'] ? true : false;
        permissions.perm_sale = user.permissions['coach-seat-selling-full-control'] || user.permissions['coach-seat-selling'] ? true : false;
        permissions.perm_booking_or_sale = user.permissions['coach-seat-booking-full-control'] || user.permissions['coach-seat-booking'] || user.permissions['coach-seat-selling-full-control'] || user.permissions['coach-seat-selling'] ? true : false;

       return permissions;
    }
};
