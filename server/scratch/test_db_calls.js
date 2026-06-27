const db = require('../config/conn');

// Test 1: Try inserting a staff with the same logic as addStaff
const staffData = {
  name: 'Test Staff 2',
  roll_no: 'STAFF123',
  email: 'staff123@nscet.edu',
  department_id: 1,
  role_id: 2
};

db.query('INSERT INTO users (name, roll_no, email, department_id, role_id) VALUES (?, ?, ?, ?, ?)', 
  [staffData.name, staffData.roll_no, staffData.email, staffData.department_id, staffData.role_id], 
  (err, result) => {
    if (err) {
      console.error('❌ addStaff test failed:', err);
    } else {
      console.log('✅ addStaff test success:', result);
      // Clean it up
      db.query('DELETE FROM users WHERE id = ?', [result.insertId], (err2) => {
        if (err2) console.error('Cleanup failed:', err2);
      });
    }

    // Test 2: Try updating password
    db.query('UPDATE users SET password = ? WHERE id = ?', ['somehashedpassword', 15], (err3, result3) => {
      if (err3) {
        console.error('❌ password update test failed:', err3);
      } else {
        console.log('✅ password update test success:', result3);
      }
      process.exit(0);
    });
  }
);
