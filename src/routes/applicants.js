const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const moment = require('moment');
const helper = require('../lib/helpers');
const dbc = require('../models/common');
const _ = require("underscore");
const { hasPermission, complexPermissions } = require('../lib/permission');
const json2csv = require('json2csv').parse;
const fs = require("fs");
var XLSX = require('xlsx');
var a2u = require('bn-ansi-to-unicode');
// var x = require("bn-bijoy-to-unicode")
var numbers = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯'
};

var convertUnicode = require('../lib/convert-to-unicode');
const { check } = require('express-validator/check');
const { post } = require('request');

// const fields = ["name", "password", "con_password", "mobile", "emergency_mobile", "address", "staff_type_id"];
const fields = ["pc_id", "voter_name", "voter_details"];

router.get('/', async (req, res) => {
    let applicants = await pool.query(`SELECT a.id, a.name name, a.father_name father_name, present_addr, perm_addr, eq, exp, dis, a.roll_no roll_no, quota, remarks,
                                        p.name post_name
                                       FROM applicants a LEFT JOIN c_posts p ON p.id = a.post_id`);
    res.render('applicants/applicants', {applicants: applicants});
});

router.get('/test-pic', async (req, res) => {
    res.render('applicants/test-pic-take', {applicants: null});
});

router.get('/test-convert', async (req, res) => {
    // let x = convertUnicode.ConvertToUnicode("bijoy", "Rbve bqb b›`x wcZv-g„Z wgjb b›`x gvZv-AwbZv b›`x")
    let x= a2u.bnBijoy2Unicode("bijoy", "Rbve bqb b›`x wcZv-g„Z wgjb b›`x gvZv-AwbZv b›`x");
    console.log(x);
});

router.get('/gen-roll/:post_id', async (req, res) => {
    let r = {};
    try {
        let post_id = req.params.post_id;
        let post = await pool.query(`SELECT p_order FROM c_posts WHERE id = ?`, [post_id]);
        
        if(post.length >= 1) {
            let p_order = post[0].p_order;
            let roll_prefix = `${pad(p_order, 2)}`;
            let applicants = await pool.query(`SELECT * FROM applicants WHERE post_id = ?`, [post_id]);
            let counter = 0;
            
            for (const a of applicants) {
                let applicant_id = a.id;
                counter = parseInt(counter) + 1;
                let roll_no = roll_prefix + pad(counter, 4);
                roll_no = replaceNumbers(roll_no);
                console.log(roll_no);
                await updateRoll(roll_no, applicant_id);
            }
            
            r.status = true;
            r.msg = `Roll numbers generated successfully for post ID: ${post_id}`;
            r.total = applicants.length;
        } else {
            r.status = false;
            r.msg = `No Post found with ID: ${post_id}`;
        }
    } catch (err) {
        console.log("Error While Generating Roll Numbers: " + err);
        r.status = false;
        r.msg = err.message || 'An error occurred';
    }
    res.send(r);
});

router.get('/import-csv', async (req, res) => {
    var workbook = XLSX.readFile("./src/data/excels/23.assistant_programmer.xlsx");
    var sheet_name_list = workbook.SheetNames;

    let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    // console.log(data);
    
    _.each(data, async function(d) {
        // console.log(d);
        let save = await pool.query(`SET CHARACTER SET utf8`);
        let save1 = await pool.query(`SET SESSION collation_connection ='utf8_general_ci'`);
        
        // const toEn = n => n.replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
        // // Tests
        // console.log(toEn("৬৭৮৯.৮৯"));                 //6789.89
        // console.log(toEn("The Number is: ৬৭৮৯.৮৯"));  //The Number is: 6789.89
        // console.log(toEn("০১২৩৪৫৬৭৮৯.৮৯"));          //0123456789.89
        // console.log(toEn("০১২৩৪৫৬৭৮৯"));              //0123456789
        // console.log(toEn("দাম ১২৩৪"));                  //দাম 1234
        // console.log(toEn("মোট ১২৩৪"));                 //মোট 1234

        // let items = d[2].split("পিতা-");
        console.log(d['name']);
        
        let items;
        if(d['name'].includes("পিতা-") || d['name'].includes("wcZv-")) {
            items = d['name'].includes("পিতা-") ? d['name'].split("পিতা-") : d['name'].split("wcZv-");
        } else {
            items = d['name'].includes("স্বামী-") ? d['name'].split("স্বামী-") : d['name'].split("¯^vgx-");
        }
        let a_name = items[0].trim();
        let f_name = items[1].includes("মাতা-") ? items[1].split("মাতা-")[0].trim() : items[1].split("gvZv-")[0].trim();
        let m_name = items[1].includes("মাতা-") ? items[1].split("মাতা-")[1].trim() : items[1].split("gvZv-")[1].trim();  
        // items[1].split("মাতা-")[1].trim();
        console.log(a_name, f_name, m_name);

        post_id = 3;
        // console.log(items);


        // console.log(d[2], items, a_name, f_name)

        let save2 = await pool.query(`INSERT INTO applicants SET name = ?, post_id = ?, father_name = ?, mother_name = ?, present_addr = ?, perm_addr = ?, eq = ?, dob = ?, porder_details = ?, remarks = ?`, 
                                [a_name, post_id, f_name, m_name,
                                d[3], d[4], d[5], d[6], d[7], d[8]]);

        

    });
    let r = {};
    res.send(r);
    return;
});

router.get('/import-csv-1', async (req, res) => {
    let obj = [
                // {file_name: "11.ElectricHelper", post_id: 11},
                // {file_name: "17.Moajjin", post_id: 17},
                // {file_name: "16.Maali", post_id: 16},
                // {file_name: "6.Escalator_operator", post_id: 6},
                // {file_name: "8.AutoElectrician", post_id: 8},
                // {file_name: "12.Electrician", post_id: 12},
                // {file_name: "21.AsstPumpDriver", post_id: 21},
                // {file_name: "18.LiftMechanic", post_id: 18},
                // {file_name: "20.AsstCashier", post_id: 20},
                // {file_name: "19.LiftMan", post_id: 19}
                // {file_name: "23.assistant_programmer", post_id: 23}
                // {file_name: "37.GIS_operator", post_id: 37}
                // {file_name: "37.GIS_operator", post_id: 37}
                {file_name: "41.office_sohayok_02", post_id: 41}
            ];

    let result = `<pre>`;
    _.each(obj, async function(o) {
        let check1 = await pool.query(`SELECT count(id) count FROM applicants WHERE post_id = ${o.post_id}`);
        console.log(check1[0].count);
        if(check1[0].count < 1 || true) {   
            // console.log(o.file_name, o.post_id);
            var workbook = XLSX.readFile(`./src/data/excels/${o.file_name}.xlsx`);
            var sheet_name_list = workbook.SheetNames;

            let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
            console.log(data);

            let post_id = o.post_id;
            _.each(data, async function(d) {
               
                let save = await pool.query(`SET CHARACTER SET utf8`);
                let save1 = await pool.query(`SET SESSION collation_connection ='utf8_general_ci'`);

                let a_name = '';
                let f_name = '';
                let m_name = '';

                let skip_split = true;

                if(!skip_split && (d['name'].includes("পিতা-") || d['name'].includes("wcZv-"))) {
                    let items;
                    if(d['name'].includes("পিতা-") || d['name'].includes("wcZv-")) {
                        items = d['name'].includes("পিতা-") ? d['name'].split("পিতা-") : d['name'].split("wcZv-");
                    } else {
                        items = d['name'].includes("স্বামী-") ? d['name'].split("স্বামী-") : d['name'].split("¯^vgx-");
                    }
                    a_name = items[0].trim();
                    f_name = items[1].includes("মাতা-") ? items[1].split("মাতা-")[0] : items[1].split("gvZv-")[0];
                    m_name = items[1].includes("মাতা-") ? items[1].split("মাতা-")[1] : items[1].split("gvZv-")[1];    
                    // console.log(a_name, f_name, m_name);
                } else if(!skip_split && (d['father_name'].includes("পিতা-") || d['father_name'].includes("wcZv-"))) {
                    // console.log("reached here");
                    a_name = d['name'];
                    f_name = d['father_name'].split(",")[0].trim();
                    m_name = d['father_name'].split(",")[1].trim();
                } else {
                    console.log("reached here");
                    a_name = d['name'];
                    f_name = d['father_name'];
                    m_name = '';
                }

                let perm_addr = d['perm_addr'];
                let present_addr = d['present_addr'];
                let education = d['education'];
                let dob = d['dob'];
                let payment_details = d['payment_details'];
                let remarks = '';
                let dis = '';
                let quota = '';
                // console.log(d['sl'], a_name, f_name, m_name, perm_addr, present_addr, education, dob, payment_details, remarks, dis, quota);
                console.log(d['sl'], d['name']);
                // let save2 = await pool.query(`INSERT INTO applicants SET name = ?, post_id = ?, father_name = ?, mother_name = ?, 
                //                             present_addr = ?, perm_addr = ?, eq = ?, exp = ?, dob = ?, dis = ?, quota = ?, porder_details = ?, remarks = ?`, 
                //                         [a_name, post_id, f_name, m_name, present_addr, perm_addr, education, '', dob, dis, quota, payment_details, remarks]);
            });
            result += "POST ID: " + o.post_id + "<br>" + JSON.stringify(data) + `<br><br><br><br><br>`;
        } else {
            result += "POST Already Has Data: " + o.post_id + "<br>";
        }
    });

    let r = {};
    res.send(result);
    return;
});

router.get('/import-divisions', async (req, res) => {
    var workbook = XLSX.readFile("./src/data/districts-divisions/Divisions.xlsx");
    var sheet_name_list = workbook.SheetNames;
    let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    console.log(data);

    _.each(data, async function(d) {
        let save = await pool.query(`SET CHARACTER SET utf8`);
        let save1 = await pool.query(`SET SESSION collation_connection ='utf8_general_ci'`);
        console.log(d[0], d[1]);

        let save2 = await pool.query(`INSERT INTO c_divisions SET name = ?`,  [d[1]]);
    });
    let r = {};
    res.send(r);
    return;
});

router.get('/getApplicantsByPostID', async (req, res) => {
    let r = {};
    try {
        user_id = req.query.user_id;
        token = req.query.token;
        let authenticated = await dbc.authenticateUser(user_id, token);
        if(authenticated) {
            let post_id = req.query.post_id;

            r.district_count = await pool.query(`SELECT dis, COUNT(id) count FROM applicants WHERE post_id = ? GROUP BY dis;`, [post_id]);
        
            // r.data = await pool.query(`SELECT id, roll_no, post_id, name, father_name, mother_name, present_addr, perm_addr, eq, exp, dis, quota, dob, porder_details, remarks, img 
            //                             FROM applicants WHERE status = 1 AND post_id = ?`, [post_id]);
            
            r.data = await pool.query(`SELECT a.id, a.name name, a.father_name father_name, a.mother_name, present_addr, perm_addr, eq, exp, dis, dob, porder_details, a.roll_no roll_no, quota, remarks, a.img, dob,
                                            p.name post_name, p.id post_id, p.exam_date, p.exam_center
                                        FROM applicants a LEFT JOIN c_posts p ON p.id = a.post_id WHERE a.status = 1 AND a.post_id = ?`, [post_id]);
            
            r.status = true;
        } else {
            r.status = false;
            r.msg = `Invalid Authentication Token`;
        }
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    res.send(r);
});

router.get('/print/getApplicantsByPostID', async (req, res) => {
    let r = {};
    const { format, post_id } = req.query;
    console.log(post_id);
    let data, district_count;
    try {
        // let post_id = req.query.post_id;
        // r.data = await pool.query(`SELECT id, roll_no, post_id, name, father_name, mother_name, present_addr, perm_addr, eq, exp, dis, quota, dob, porder_details, remarks, img 
        //                             FROM applicants WHERE status = 1 AND post_id = ?`, [post_id]);
        district_count = await pool.query(`SELECT dis, COUNT(id) count FROM applicants WHERE post_id = ? GROUP BY dis;`, [post_id]);

        data = await pool.query(`SELECT a.id, a.name name, a.father_name father_name, a.mother_name, present_addr, perm_addr, eq, exp, dis, dob, porder_details, a.roll_no roll_no, quota, remarks, a.img, dob,
                                        p.name post_name, p.id post_id, p.exam_date, p.exam_center
                                    FROM applicants a LEFT JOIN c_posts p ON p.id = a.post_id WHERE a.status = 1 AND a.post_id = ?`, [post_id]);
        
        r.status = true;
        
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    console.log(data);
    res.render('applicants/print_applicant', {applicants: data, district_count: district_count, format: format});
});

router.get('/getPrevApplicant', async (req, res) => {
    let r = {};
    try {
        let applicant_id = req.query.applicant_id;
        let post_id = req.query.post_id;

        r.data = await pool.query(`SELECT a.id, a.name name, a.father_name father_name, a.mother_name, present_addr, perm_addr, eq, exp, dis, a.roll_no roll_no, quota, remarks, a.img, dob, 
                                    p.name post_name, p.id post_id, p.exam_date, p.exam_center
                                    FROM applicants a 
                                    LEFT JOIN c_posts p ON p.id = a.post_id WHERE a.status = 1 AND a.post_id = ? 
                                    AND a.id = (select max(a.id) from applicants a where a.id < ?)`, [post_id, applicant_id]);
        r.status = true;
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    res.send(r);
});

router.get('/getNextApplicant', async (req, res) => {
    let r = {};
    try {
        let applicant_id = req.query.applicant_id;
        let post_id = req.query.post_id;

        r.data = await pool.query(`SELECT a.id, a.name name, a.father_name father_name, a.mother_name, present_addr, perm_addr, eq, exp, dis, a.roll_no roll_no, quota, remarks, a.img, dob, 
                                    p.name post_name, p.id post_id, p.exam_date, p.exam_center
                                    FROM applicants a 
                                    LEFT JOIN c_posts p ON p.id = a.post_id WHERE a.status = 1 AND a.post_id = ? 
                                    AND a.id = (select min(a.id) from applicants a where a.id > ?)`, [post_id, applicant_id]);
        r.status = true;
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
    }
    res.send(r);
});

router.post('/uploadImg', async (req, res) => {
    let r = {};
    try {
        let user_id = req.body.user_id;
        let token = req.body.token;
        let authenticated = await dbc.authenticateUser(user_id, token);
        if(authenticated) {
            let img = req.body.img_data;
            let applicant_id = req.body.applicant_id;

            let upload_dir = 'src/public/img/applicants/';
            if (!fs.existsSync(upload_dir + "/")) {
                fs.mkdirSync(upload_dir + "/");
            }
            
            let new_filename = applicant_id + ".png";
            var data     = img.split(',')[1]
            let buff = Buffer.from(data, 'base64');
            fs.writeFileSync(upload_dir + "/" + new_filename, buff);

            await pool.query('UPDATE applicants SET img = ? WHERE id = ?', [new_filename, applicant_id]);
            r.status = true;
            r.filename = new_filename; 
            // r.data = img;
            r.msg = `Picture upload successful`;
        } else {
            r.status = false;
            r.msg = `Invalid Authentication Token`;
        }
    } catch (err) {
        console.log("Error While Exploring Requests: " + err);
        r.status = false;
        r.msg = err;
    }
    res.send(r);
});

router.post('/saveApplicantInfo', async (req, res) => {
    let r = {};
    try {
        console.log(req.body)
        let user_id = req.body.user_id;
        let token = req.body.token;
        let applicant_id = req.body.app_id;
        let name = req.body.name;
        let fname = req.body.fname;
        let mname = req.body.mname;
        let dis = req.body.dis;
        let quota = req.body.quota;
        let perm_addr = req.body.perm_addr;

        let temp_addr = req.body.temp_addr;
        let porder_details = req.body.porder_details;
        let eq = req.body.eq;
        let exp = req.body.exp;
        let dob = req.body.dob;
        let remarks = req.body.remarks;



        let authenticated = await dbc.authenticateUser(user_id, token);
        if(authenticated) {
            await pool.query(`UPDATE applicants SET name = ?, father_name = ?, mother_name = ?, 
                                dis = ?, quota = ?, remarks = ?, perm_addr = ?, present_addr = ?, porder_details = ?, eq = ?, exp = ?, dob = ? WHERE id = ?`, [name, fname, mname, dis, quota, remarks, perm_addr, temp_addr, porder_details, eq, exp, dob, applicant_id]);
            r.status = true;
            // r.data = img;
            r.msg = `Data Saved Successfully`;
        } else {
            r.status = false;
            r.msg = `Invalid Authentication Token`;
        }
    } catch (err) {
        console.log("Error While updating Applicant: " + err);
        r.status = false;
        r.msg = err;
    }
    res.send(r);
});

function downloasAsCSV(data, res) {
    const csvString = json2csv(data);
    res.setHeader('Content-disposition', 'attachment; filename=vote-list-report.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvString);
}

function pad(n, length) {
    var len = length - (''+n).length;
    return (len > 0 ? new Array(++len).join('0') : '') + n
}

function updateRoll(roll_no, applicant_id) {
    return new Promise(async function(resolve, reject) {
        let r = null;
        try {
            let update = await pool.query(`UPDATE applicants SET roll_no = ? WHERE id = ?`, [roll_no, applicant_id]);
            r = r.length > 0 ? r: null;
        } catch (err) {
            r = null;
        }
        resolve(r);
    });
}

function replaceNumbers(input) {
    var output = [];
    for (var i = 0; i < input.length; ++i) {
      if (numbers.hasOwnProperty(input[i])) {
        output.push(numbers[input[i]]);
      } else {
        output.push(input[i]);
      }
    }
    return output.join('');
}

module.exports = router;