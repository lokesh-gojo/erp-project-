const db = require('../config/conn');

const sql = `
  SELECT 
    TRIGGER_NAME, 
    EVENT_MANIPULATION, 
    ACTION_TIMING, 
    ACTION_STATEMENT 
  FROM 
    information_schema.TRIGGERS 
  WHERE 
    EVENT_OBJECT_SCHEMA = 'nscetiqarena' AND EVENT_OBJECT_TABLE = 'users'
`;

db.query(sql, (err, results) => {
  if (err) {
    console.error('❌ ERROR:', err);
  } else {
    console.log('✅ TRIGGERS:');
    console.table(results);
  }
  process.exit(0);
});
