require('dotenv').config();

module.exports = {
    database: {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '3307',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cr'
    },
    bulksms: {
        url: process.env.BULKSMS_URL || 'http://bulksmsbd.net/api/smsapi?api_key=',
        sender_id: process.env.BULKSMS_SENDER_ID || '',
    }

};