require('dotenv').config();
const express = require('express');
const db = require('./config/conn');

const app = express();
const PORT = process.env.PORT || 3020;

/* =====================================================
   CORS – SAFE & WORKING (NO HARD-CODED ORIGIN)
   MUST BE FIRST MIDDLEWARE
===================================================== */
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow frontend dynamically (localhost / LAN / domain)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,PATCH,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // Enforce JSON for API write requests
  if (
    req.path.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH'].includes(req.method) &&
    !req.is('application/json')
  ) {
    return res.status(415).json({
      error: 'Only application/json is allowed'
    });
  }

  next();
});

/* =====================================================
   BODY PARSER
===================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   ROUTES
===================================================== */

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Department routes
app.use('/api/dept', require('./routes/dept'));

// Student routes
app.use('/api/users', require('./routes/user'));

// Question routes
app.use('/api/question', require('./routes/question'));

// Topic routes
app.use('/api/topic', require('./routes/topic'));

// Test routes
app.use('/api/test', require('./routes/test'));

// Staff Reports routes
app.use('/api/reports', require('./routes/staffReports'));

// Quiz routes
app.use('/api/quiz', require('./routes/quiz'));

// Leaderboard routes
app.use('/api/leaderboard', require('./routes/leaderboard'));

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get('/', (req, res) => {
  res.send('Server is running and connected to MySQL!');
});

/* =====================================================
   START SERVER
===================================================== */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});