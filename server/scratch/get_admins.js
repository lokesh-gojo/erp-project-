const db = require('../config/conn');

db.query('SELECT id, roll_no, name, email, role_id FROM users WHERE role_id = 5', (err, results) => {
  if (err) {
    console.error('❌ ERROR:', err);
  } else {
    console.log('✅ SUPER-ADMINS:');
    console.table(results);
  }
  process.exit(0);
});
