const pool = require('../database');
const _ = require("underscore");
const moment = require('moment');

const dbc = {};

dbc.authenticateUser = async (user_id, token) => {
    return new Promise(async function(resolve, reject) {
        let q = await pool.query(`SELECT id FROM c_operators o WHERE o.id = ? AND o.token = ?`, [user_id, token]);
        let authenticated = q.length >=1 ? true : false;
        resolve(authenticated);
    });
}

dbc.getVenuesByDistrictName = async (name) => {
    return new Promise(async function(resolve, reject) {
        let venues = null;
        try {
            venues = await pool.query(`SELECT v.id venue_id, v.name venue_name
                                            FROM z_venues v 
                                            JOIN z_thanas t ON t.id = v.thana_id
                                            JOIN z_districts d ON t.district_id = d.id
                                            WHERE d.status = 1 AND t.status = 1 AND v.status = 1 AND d.name LIKE '%${name}%'`);
            venues = venues.length > 0 ? venues: null;
        } catch (err) {
            venues = null;
        }
        resolve(venues);
    });
};

dbc.getVenuesByName = async (name) => {
    return new Promise(async function(resolve, reject) {
        let venues = null;
        try {
            venues = await pool.query(`SELECT v.id venue_id, v.name venue_name
                                            FROM z_venues v 
                                            WHERE v.status = 1 AND v.name LIKE '%${name}%'`);
            venues = venues.length > 0 ? venues: null;
        } catch (err) {
            venues = null;
            console.log(err);
        }
        resolve(venues);
    });
};

dbc.getAllRoutes = async () => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name FROM c_routes WHERE status = 1');
        } catch (err) {
            result = null;
        }
        resolve(result);
    }); 
};

dbc.getRouteWiseCounters = async (company_id) => { /*@TODO: Counter generation is repetitive. convert to COUNTER[route_id][company_id] */
    return new Promise(async function(resolve, reject) {
        let result = {};
        let route = {};
        let company = {};
        try {
            var crcms = await pool.query(`SELECT cntr.id counter_id, cntr.name counter_name, r.id route_id, c.id company_id,
                                        crcm.counter_order, crcm.counter_type, crcm.arrival_time, crcm.regular_fare, crcm.business_fare
                                        FROM c_company_route_counter_map crcm 
                                        LEFT JOIN c_companies c ON c.id = crcm.company_id
                                        LEFT JOIN c_routes r ON r.id = crcm.route_id
                                        LEFT JOIN c_counters cntr ON cntr.id = crcm.counter_id 
                                        WHERE crcm.status = 1 AND cntr.status = 1
                                        ORDER BY crcm.route_id, crcm.company_id, crcm.counter_order`);
            for(let i = 0; i < crcms.length; i++) {
                let crcm = crcms[i];
                let company_id = crcm.company_id;
                let route_id = crcm.route_id;
                let counter_type = crcm.counter_type;
                if(!route[company_id]) {
                    route[company_id] = {};
                }
                if(!result[route_id]) {
                    result[route_id] = {};
                }
                if(!result[route_id][company_id]) {
                    result[route_id][company_id] = {};
                }
                if(!result[route_id][company_id][counter_type]) {
                    result[route_id][company_id][counter_type] = [];
                }
                result[route_id][company_id][counter_type].push(crcm);
            }
        } catch (err) {
            console.log(err);
        }    
        resolve(result);
    });
};

dbc.getCompanies = async () => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name FROM c_companies WHERE status = "1"');
        } catch (err) {
            result = null;
        }
        resolve(result);
    });
};

dbc.getCompanyRoutes = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT cr.id, cr.name FROM c_company_routes ccr LEFT JOIN c_routes cr ON ccr.route_id = cr.id WHERE ccr.company_id = ? AND cr.status = "1"', [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    }); 
};

dbc.getCompanyVehicles = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, license_plate_no, make, model, no_of_seats FROM c_vehicles WHERE company_id = ? AND status = "1"', [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
};

dbc.getAssignedCompanyCounters = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query(`SELECT DISTINCT(cntrs.id), cntrs.name, cntrs.code, cntrs.contact
                                        FROM c_company_route_counter_map crcm 
                                        LEFT JOIN c_counters cntrs ON cntrs.id = crcm.counter_id
                                        WHERE crcm.company_id = ? AND crcm.status = "1"`, [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
};

dbc.getAvailableCompanyCounters = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query(`SELECT DISTINCT(cntrs.id), cntrs.name, cntrs.code, cntrs.contact
                                        FROM c_counters cntrs
                                        WHERE cntrs.company_id = ? AND cntrs.status = "1"`, [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })  
};

// dbc.getCompanyCountersByRoute = async (company_id, route_id) => {
//     return new Promise(async function(resolve, reject) {
//         let result;
//         try {
//             result = await pool.query(`SELECT cntrs.id, cntrs.name, cntrs.code, cntrs.contact FROM c_company_route_counter_map crcm 
//                                         LEFT JOIN c_counters cntrs ON cntrs.id = crcm.counter_id
//                                         WHERE crcm.company_id = ? AND crcm.route_id = ? AND crcm.status = "1"`, [company_id, route_id]);
//         } catch (err) {
//             result = null;
//         }
//         resolve(result);
//     })  
// };

dbc.getCompanyDrivers = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name, mobile FROM c_staffs WHERE company_id = ? AND staff_type_id = "1" AND status = "1"', [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })
};

dbc.getCompanySupervisors = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name, mobile FROM c_staffs WHERE company_id = ? AND staff_type_id = "2" AND status = "1"', [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })
};

dbc.getCompanyHelpers = async (company_id) => {
    return new Promise(async function(resolve, reject) {
        let result;
        try {
            result = await pool.query('SELECT id, name, mobile FROM c_staffs WHERE company_id = ? AND staff_type_id = "3" AND status = "1"', [company_id]);
        } catch (err) {
            result = null;
        }
        resolve(result);
    })
};

dbc.getTrnxTypes = async () => {
    return new Promise(async function(resolve, reject) {
        try {
            let types = await pool.query("SELECT id, name FROM c_transaction_types WHERE status = 1");
            resolve(types);
        } catch(err) {
            console.log(err);
            reject(err);
        }
    });
}

dbc.getTrnxHeads = async () => {
    return new Promise(async function(resolve, reject) {
        try {
            let types = await pool.query("SELECT id, name, trnx_type_id FROM c_transaction_heads WHERE status = 1");
            resolve(types);
        } catch(err) {
            console.log(err);
            reject(err);
        }
    });
}

dbc.checkIFCoachExpired = async (coach_id) => {
    return new Promise(async function(resolve, reject) {
        try {
            let r = false;
            let data = await pool.query('SELECT c.departure_date, c.departure_time FROM c_coaches c WHERE c.id = ?', [coach_id]);
            let ticket_datetime = moment(data[0].departure_date, 'YYYY-MM-DD').format('YYYY-MM-DD') + " " + data[0].departure_time;
            let current_datetime = moment().format('YYYY-MM-DD HH:mm:ss');
            if(ticket_datetime < current_datetime) {
                r = true;
            } else {
                r = false;
            }
            resolve(r);
        } catch(err) {
            console.log(err);
            reject(err);
        }
    });
}

dbc.getDistrictThanas = async (coach_id) => {
    return new Promise(async function(resolve, reject) {
        let r = {};
        try {
            let dlist = await pool.query(`SELECT id, name FROM z_districts WHERE status = 1`);
            let tlist = await pool.query(`SELECT id, name, district_id FROM z_thanas WHERE status = 1 `);
            r.status = true;
            r.data = {"dlist": dlist, "tlist": tlist};
            resolve(r);
        } catch(err) {
            console.log("Error While Getting RS District List: " + err);
            reject(err);
        }
    });
}

module.exports = dbc;