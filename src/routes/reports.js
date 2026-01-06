const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

// Reports page - shows post dropdown and applicants
router.get('/', async (req, res) => {
    try {
        // Get only specific active posts (IDs: 1, 33, 34, 35, 36)
        let posts = await pool.query(`SELECT id, name, description FROM c_posts WHERE status = 1 AND id IN (1, 33, 34, 35, 36) ORDER BY p_order ASC`);
        res.render('reports/index', { posts: posts });
    } catch (err) {
        console.log("Error While Getting Posts: " + err);
        res.render('reports/index', { posts: [] });
    }
});

// API endpoint to get applicants by post ID
router.get('/getApplicantsByPost', async (req, res) => {
    let r = {};
    try {
        let post_id = req.query.post_id;

        if (!post_id) {
            r.status = false;
            r.msg = 'Post ID is required';
            return res.send(r);
        }

        // Get applicants for the selected post
        r.data = await pool.query(`SELECT a.id, a.name name, a.father_name father_name, a.mother_name, 
                                    present_addr, perm_addr, eq, exp, dis, dob, porder_details, 
                                    a.roll_no roll_no, quota, remarks, a.img, 
                                    p.name post_name, p.id post_id, p.exam_date, p.exam_center
                                    FROM applicants a 
                                    LEFT JOIN c_posts p ON p.id = a.post_id 
                                    WHERE a.status = 1 AND a.post_id = ? 
                                    ORDER BY a.roll_no ASC, a.id ASC`, [post_id]);
        console.log(r.data);
        r.status = true;
    } catch (err) {
        console.log("Error While Getting Applicants: " + err);
        r.status = false;
        r.msg = err.message || 'An error occurred';
    }
    res.send(r);
});

module.exports = router;

