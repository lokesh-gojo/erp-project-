const db = require('../config/conn');

db.query('SELECT * FROM users WHERE roll_no = ?', ['ns9210'], (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log('✅ User details for ns9210:');
    console.log(results[0]);
  }
  process.exit(0);
});
