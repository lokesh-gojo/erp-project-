const db = require('../config/conn');
const bcrypt = require('bcryptjs');

const passwordToSet = '123';

bcrypt.genSalt(10, (saltErr, salt) => {
  if (saltErr) {
    console.error('Salt generation error:', saltErr);
    process.exit(1);
  }
  bcrypt.hash(passwordToSet, salt, (hashErr, hash) => {
    if (hashErr) {
      console.error('Hash error:', hashErr);
      process.exit(1);
    }
    db.query("UPDATE users SET password = ? WHERE roll_no = 'ns9210'", [hash], (err, result) => {
      if (err) {
        console.error('Database error:', err);
      } else {
        console.log('✅ Hashed password updated in database successfully.');
        console.log('New Hash:', hash);
      }
      process.exit(0);
    });
  });
});
