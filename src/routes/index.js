const express = require('express');
const router = express.Router();
const COACHES = require('./~~coaches');

router.get('/', async (req, res) => {
    COACHES.getCoachUI(req, res, 'null');
});

module.exports = router;