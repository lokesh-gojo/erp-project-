const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'nscetiqarena'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected to database.');

  const alterTopics = "ALTER TABLE topics ADD COLUMN type ENUM('regular', 'placement') DEFAULT 'regular';";
  const alterTests = "ALTER TABLE tests ADD COLUMN type ENUM('regular', 'placement') DEFAULT 'regular';";

  connection.query(alterTopics, (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column type already exists in topics.');
      } else {
        console.error('Error altering topics: ', err);
      }
    } else {
      console.log('Successfully altered topics table.');
    }

    connection.query(alterTests, (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('Column type already exists in tests.');
        } else {
          console.error('Error altering tests: ', err);
        }
      } else {
        console.log('Successfully altered tests table.');
      }

      connection.end();
    });
  });
});
