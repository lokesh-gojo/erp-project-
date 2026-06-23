const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  connectionLimit: 25,          // SAFE for your exam load
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  queueLimit: 0
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Pool connection failed:', err.code);
    return;
  }
  console.log('✅ MySQL Pool connected. Thread ID:', connection.threadId);
  connection.release();
});

// Optional: log unexpected pool errors
pool.on('error', (err) => {
  console.error('🔥 MySQL Pool Error:', err.code);
});

module.exports = pool;