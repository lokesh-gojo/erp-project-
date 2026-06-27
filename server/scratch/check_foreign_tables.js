const db = require('../config/conn');

db.query('SHOW CREATE TABLE departments', (err, result1) => {
  if (err) console.error(err);
  else console.log('✅ departments:', result1[0]['Create Table']);

  db.query('SHOW CREATE TABLE roles', (err2, result2) => {
    if (err2) console.error(err2);
    else console.log('✅ roles:', result2[0]['Create Table']);
    process.exit(0);
  });
});
