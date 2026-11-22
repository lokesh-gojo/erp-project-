const db = require('../config/conn');

db.query('SHOW INDEX FROM users', (err, indexes) => {
  if (err) {
    console.error('❌ SHOW INDEX ERROR:', err);
  } else {
    console.log('✅ INDEXES:');
    console.table(indexes);
  }

  db.query('SELECT id, roll_no, name, email, role_id, department_id FROM users ORDER BY id DESC LIMIT 10', (err2, users) => {
    if (err2) {
      console.error('❌ SELECT USERS ERROR:', err2);
    } else {
      console.log('✅ RECENT USERS:');
      console.table(users);
    }
    process.exit(0);
  });
});
