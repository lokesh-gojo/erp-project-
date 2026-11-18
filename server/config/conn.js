require('dotenv').config();

let db;

// Detect if Supabase PostgreSQL is configured via DATABASE_URL or SUPABASE_DB_URL
const postgresUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (postgresUrl) {
  const { Pool } = require('pg');
  console.log('🔌 Connecting to Supabase PostgreSQL...');

  const pgPool = new Pool({
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
  });

  // Handle unexpected errors on idle clients to prevent crashing the server
  pgPool.on('error', (err) => {
    // Supabase server pooler idle reset is normal
    if (err.code !== 'ECONNRESET') {
      console.warn('⚠️ Supabase Pool notice (handled):', err.message);
    }
  });

  pgPool.connect((err, client, release) => {
    if (err) {
      console.error('❌ Supabase PostgreSQL connection failed:', err.message);
      return;
    }
    console.log('✅ Supabase PostgreSQL connected successfully!');
    release();
  });

  // Query transformer: maps MySQL ? placeholders to PostgreSQL $1, $2, ...
  function transformQuery(sql, params = []) {
    const flat = [];
    let pIndex = 0;

    let convertedSql = sql.replace(/\?/g, () => {
      if (pIndex >= params.length) return `$${pIndex + 1}`;
      const val = params[pIndex++];
      if (Array.isArray(val)) {
        if (val.length === 0) return 'NULL';
        if (Array.isArray(val[0])) {
          // Bulk insert: [[c1, c2], [c3, c4]] -> ($1, $2), ($3, $4)
          const rowPlaceholders = val.map(row => {
            const colPlaceholders = row.map(col => {
              flat.push(col);
              return `$${flat.length}`;
            });
            return `(${colPlaceholders.join(', ')})`;
          });
          return rowPlaceholders.join(', ');
        } else {
          const placeholders = val.map(item => {
            flat.push(item);
            return `$${flat.length}`;
          });
          return placeholders.join(', ');
        }
      } else {
        flat.push(val);
        return `$${flat.length}`;
      }
    });

    // If it's an INSERT statement without RETURNING, append RETURNING * to capture insertId
    const isInsert = /^\s*INSERT\s+INTO/i.test(convertedSql);
    const hasReturning = /\bRETURNING\b/i.test(convertedSql);
    if (isInsert && !hasReturning) {
      convertedSql += ' RETURNING *';
    }

    // Convert MySQL-specific "WHERE 1" to PostgreSQL "WHERE 1=1"
    convertedSql = convertedSql.replace(/\bWHERE\s+1(?=[\s;]|$)/gi, 'WHERE 1=1');

    // Convert MySQL TIMESTAMPDIFF(SECOND, ...) to PostgreSQL TIMESTAMPDIFF('SECOND', ...)
    convertedSql = convertedSql.replace(/TIMESTAMPDIFF\s*\(\s*([A-Za-z]+)\s*,/gi, "TIMESTAMPDIFF('$1',");

    return { sql: convertedSql, params: flat };
  }

  db = {
    query: (sql, params, callback) => {
      // Support query(sql, callback) without params
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      const { sql: pgSql, params: pgParams } = transformQuery(sql, params || []);

      const runWithRetry = (attemptsLeft = 2) => {
        pgPool.query(pgSql, pgParams, (err, res) => {
          if (err) {
            if (attemptsLeft > 0 && (err.code === 'ECONNRESET' || err.message?.includes('Connection terminated') || err.message?.includes('closed'))) {
              return setTimeout(() => runWithRetry(attemptsLeft - 1), 300);
            }
            return callback(err, null);
          }

          const rows = res.rows || [];
          const result = [...rows]; // Array of rows for SELECT queries

          // Add MySQL compatibility properties
          const firstRow = rows[0] || {};
          result.insertId =
            firstRow.id ||
            firstRow.test_id ||
            firstRow.question_id ||
            firstRow.student_test_id ||
            firstRow.topic_id ||
            firstRow.sub_topic_id ||
            firstRow.student_answers_id ||
            0;
          result.affectedRows = res.rowCount || 0;

          callback(null, result);
        });
      };

      runWithRetry();
    },
    getConnection: (cb) => {
      pgPool.connect((err, client, release) => {
        if (err) return cb(err);
        cb(null, { release, query: client.query.bind(client) });
      });
    },
    on: pgPool.on.bind(pgPool),
    rawPool: pgPool,
  };

  const promiseObj = {
    query: (sql, params) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve([results, []]);
        });
      });
    }
  };
  db.promise = () => promiseObj;
} else {
  // Fallback to local MySQL pool
  const mysql = require('mysql2');
  console.log('🔌 Connecting to local MySQL...');

  const pool = mysql.createPool({
    connectionLimit: 25,
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'preptrack',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    queueLimit: 0,
  });

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('❌ MySQL Pool connection failed:', err.code);
      return;
    }
    console.log('✅ MySQL Pool connected. Thread ID:', connection.threadId);
    connection.release();
  });

  pool.on('error', (err) => {
    console.error('🔥 MySQL Pool Error:', err.code);
  });

  db = pool;
}

module.exports = db;
