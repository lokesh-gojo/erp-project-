const db = require('../config/conn');

db.query('SELECT roll_no, password FROM users WHERE roll_no = "ns9210"', (err, results) => {
  if (err) {
    console.error('❌ ERROR:', err);
  } else {
    console.log('✅ SUPERADMIN ROW:', results[0]);
  }
  process.exit(0);
});
