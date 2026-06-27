const db = require('../config/conn');

db.query("UPDATE users SET email = 'admin@nscet.edu' WHERE roll_no = 'ns9210'", (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log('✅ User ns9210 email updated successfully.');
  }
  process.exit(0);
});
