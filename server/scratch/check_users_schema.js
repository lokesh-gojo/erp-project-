const db = require('../config/conn');

db.query('SHOW CREATE TABLE users', (err, results) => {
  if (err) {
    console.error('❌ SHOW CREATE TABLE ERROR:', err);
  } else {
    console.log('✅ SHOW CREATE TABLE users:');
    console.log(results[0]['Create Table']);
  }

  db.query('SELECT * FROM departments', (err2, depts) => {
    if (err2) {
      console.error('❌ SELECT depts ERROR:', err2);
    } else {
      console.log('✅ DEPARTMENTS:');
      console.table(depts);
    }

    db.query('SELECT * FROM roles', (err3, roles) => {
      if (err3) {
        console.error('❌ SELECT roles ERROR:', err3);
      } else {
        console.log('✅ ROLES:');
        console.table(roles);
      }
      process.exit(0);
    });
  });
});
