const mysql = require('mysql');
const { promisify }= require('util');

const { database } = require('./keys');

// const pool = mysql.createPool(database);

const pool = mysql.createConnection(database);

let save = pool.query(`SET CHARACTER SET utf8`);
let save1 = pool.query(`SET SESSION collation_connection ='utf8_general_ci'`);

// pool.getConnection((err, connection) => {
//   if (err) {
//     if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//       console.error('Database connection was closed.');
//     }
//     if (err.code === 'ER_CON_COUNT_ERROR') {
//       console.error('Database has to many connections');
//     }
//     if (err.code === 'ECONNREFUSED') {
//       console.error('Database connection was refused');
//     }
//   }

//   if (connection) connection.release();
//   console.log('DB is Connected');

//   return;
// });

// Promisify Pool Querys
pool.query = promisify(pool.query);

module.exports = pool;
