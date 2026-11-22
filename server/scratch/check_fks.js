const db = require('../config/conn');

const sql = `
  SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME 
  FROM 
    information_schema.KEY_COLUMN_USAGE 
  WHERE 
    TABLE_SCHEMA = 'nscetiqarena' AND TABLE_NAME = 'users' AND REFERENCED_TABLE_NAME IS NOT NULL
`;

db.query(sql, (err, results) => {
  if (err) {
    console.error('❌ ERROR:', err);
  } else {
    console.log('✅ FOREIGN KEYS:');
    console.table(results);
  }
  process.exit(0);
});
