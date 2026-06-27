const db = require('../config/conn');
const bcrypt = require('bcryptjs');

bcrypt.hash('admin123', 10, (err, hash) => {
  if (err) {
    console.error('❌ HASH ERROR:', err);
    process.exit(1);
  }
  db.query('UPDATE users SET password = ? WHERE roll_no = "ns9210"', [hash], (err2, result) => {
    if (err2) {
      console.error('❌ UPDATE ERROR:', err2);
    } else {
      console.log('✅ UPDATE SUCCESS:', result.affectedRows);
    }
    process.exit(0);
  });
});
