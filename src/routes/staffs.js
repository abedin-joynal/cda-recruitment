const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');
const helper = require('../lib/helpers');
const _ = require("underscore");

const fields = ["name", "password", "con_password", "mobile", "emergency_mobile", "address", "staff_type_id"];

router.get('/', isLoggedIn, async (req, res) => {
    let staff_types = await getStaffTypes();
    let page = 1; 
    let offset = 10;
    let start = (page - 1) * offset;
    let start_index = parseInt(parseInt(page) - 1) * parseInt(offset);
    let name = mobile = "";
    let staff_type_id = "all";
    let query_con = generateConditions(staff_types, staff_type_id, name, mobile, req);
    let total_record = await getTotalRecords(query_con);
    total_record = total_record[0].count;
    let data = await getReportData(start, offset, query_con);
    let total_page = Math.ceil(total_record / offset);
    let pagination = helper.paginate(total_page, page);
    res.render('staffs/list', { staffs : data.records,
                start_index: start_index, staff_type_id: staff_type_id, name:name, mobile:mobile, staff_types : staff_types, 
                msg: req.session.msg,
                paginate : { total_page : total_page, page : page, offset : offset, pagination: pagination }});
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/search', isLoggedIn, async (req, res) => {
    let {staff_type_id, name, mobile, page, offset, download_csv} = req.body;
    let staff_types = await getStaffTypes();    
    offset = parseInt(offset);
    page = parseInt(page);
    download_csv = parseInt(download_csv);
    let start = (page - 1) * offset;
    let start_index = parseInt(parseInt(page) - 1) * parseInt(offset);
    let query_con = generateConditions(staff_types,staff_type_id, name, mobile, req);
    let total_record = await getTotalRecords(query_con);
    total_record = total_record[0].count;
    let data = null;
    if(download_csv == 0) {
        data = await getReportData(start, offset, query_con);
    } else {
        data = await getReportData(0, total_record, query_con);
        helper.downloasAsCSV("Staffs", data.records, res);
        return false;
    }
    let total_page = Math.ceil(total_record / offset);
    let pagination = helper.paginate(total_page, page);
    res.render('staffs/list', { staffs : data.records,
                start_index: start_index, staff_type_id: staff_type_id, name:name, mobile:mobile, staff_types : staff_types, 
                paginate : { total_page : total_page, page : page, offset : offset, pagination: pagination }});
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/signin', async (req, res) => {
    const { mobile, pwd } = req.body;
    let r = {};
    try {
        let q = await pool.query(`SELECT id, password, name, mobile, picture, staff_type_id FROM c_staffs s WHERE s.mobile = ? AND s.status = 1`, [mobile]);
        // console.log(q)
        if(q.length == 1) {
            let validPassword = await helper.matchPassword(pwd, q[0].password);
            // console.log(validPassword)
            if(validPassword) {
                r.id = q[0].id;
                r.name = q[0].name;
                r.mobile = q[0].mobile;
                r.picture = q[0].picture;
                r.staff_type_id = q[0].staff_type_id;
                r.status = true;
            } else {
                r.status = false;
            }
        } else {
            r.status = false;
        }
    } catch (err) {
        console.log(err);
        r.status = false;
    }
    res.send(r);
});

router.get('/landing', async (req, res) => {
    res.render('staffs/landing', {layout: 'main_staffs.hbs', data: null, form_data: req.session.form_data, msg: req.session.msg, errors: req.session.errors});
    req.session.errors = null;
    req.session.form_data = null;
    req.session.msg = null;
});

router.post('/getStaffDashData', async (req, res) => {
    const { id } = req.body; // staff id
    let r = {};
    try {
        let lifetime_completed_trips = await pool.query(`SELECT count(c.id) as lifetime_completed_trips FROM c_coaches AS c WHERE status = 3 AND (c.driver_id = ? OR c.helper_id = ? OR c.supervisor_id =?)`, [id, id, id]);
        let lifetime_trip_earnings = await pool.query(`SELECT SUM(ct.amount) as lifetime_trip_earnings FROM c_coaches_transactions AS ct WHERE ct.is_paid = 1 AND ct.staff_id = ? `, [id]);
        let lifetime_trip_due = await pool.query(`SELECT SUM(ct.amount) as lifetime_trip_due FROM c_coaches_transactions AS ct WHERE ct.is_paid = 0 AND ct.staff_id = ? `, [id]);
        r.status = true;
        r.lifetime_completed_trips = lifetime_completed_trips;
        r.lifetime_trip_earnings = lifetime_trip_earnings;
        r.lifetime_trip_due = lifetime_trip_due;
        // console.log(r);
        
    } catch (err) {
        console.log("Error While getting coaches in Staff Panel: " + err);
        r.status = false;
    }
    res.send(r);
});

router.post('/getCoachesByStaffID', async (req, res) => {
    const { id } = req.body; // staff id
    let r = {};
    try {
        coaches = await pool.query(`SELECT c.unique_id, c.code, c.arrival_time, c.departure_time, c.is_ac, c.status, 
        date_format(departure_date, "%D %M, %Y ") AS departure_date,
        r.name AS route, r.from_venue_id, r.to_venue_id,
        sc.name AS s_counter, ec.name AS e_counter, v.license_plate_no, 
        sd.name driver, sd.mobile driver_mobile, ss.name supervisor, ss.mobile supervisor_mobile, sh.name helper, sh.mobile helper_mobile,
        v.id vehicle_id, v.license_plate_no license_plate_no, v.make vehicle_make, v.model vehicle_model, v.no_of_seats no_of_seats
        FROM c_coaches c 
        LEFT JOIN c_routes AS r ON r.id = c.route_id
        LEFT JOIN c_counters AS sc ON sc.id = c.start_counter_id 
        LEFT JOIN c_counters AS ec ON ec.id = c.end_counter_id 
        LEFT JOIN c_vehicles AS v ON v.id = c.vehicle_id
        LEFT JOIN c_staffs AS sd ON sd.id = c.driver_id 
        LEFT JOIN c_staffs AS ss ON ss.id = c.supervisor_id 
        LEFT JOIN c_staffs AS sh ON sh.id = c.helper_id
        WHERE c.driver_id = ? OR c.supervisor_id = ? OR c.helper_id = ? 
        ORDER BY c.departure_date DESC`, [id, id, id]); /*@TODO:  */
        // console.log(coaches);
        r.status = true;
        r.coaches = coaches;
    } catch (err) {
        console.log("Error While getting coaches in Staff Panel: " + err);
        r.status = false;
    }
    res.send(r);
});

router.post('/getPassengerDetailsByCoachUniqueID', async (req, res) => {
    const { coach_unique_id } = req.body; // staff id
    let r = {};
    try {
        let tickets = await pool.query(`SELECT ct.unique_id AS ticket_unique_id, ct.seats, ct.no_of_seats, 
        s_cntrs.id start_counter_id, s_cntrs.name start_counter_name, e_cntrs.id end_counter_id, e_cntrs.name end_counter_name,
        customers.name customer_name, customers.mobile customer_mobile, customers.age customer_age, customers.gender customer_gender
        FROM c_coaches_tickets ct 
        LEFT JOIN c_coaches c ON c.id = ct.coach_id 
        LEFT JOIN c_counters s_cntrs ON s_cntrs.id = ct.c_start_counter_id
        LEFT JOIN c_counters e_cntrs ON e_cntrs.id = ct.c_end_counter_id
        LEFT JOIN c_customers customers ON customers.id = ct.customer_id
        WHERE c.unique_id = ? AND ct.issue_type = 'S'  
        ORDER BY ct.c_start_counter_id ASC`, [coach_unique_id]);
        // console.log(coaches);
        r.status = true;
        r.tickets = tickets;
    } catch (err) {
        console.log("Error While getting coaches in Staff Panel: " + err);
        r.status = false;
    }
    res.send(r);
});

module.exports = router;