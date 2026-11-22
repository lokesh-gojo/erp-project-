const db = require('./config/conn');

const sql = `
    SELECT t.test_id, t.title, t.description, t.subject, t.added_by, t.topic_id, t.sub_topic_id, 
           t.num_questions, t.department_id, t.year, t.date, t.time_slot, t.duration_minutes, 
           t.created_at, t.is_active,
           tp.title as topic_title,
           st.title as sub_topic_title,
           d.full_name as department_name,
           d.short_name as dept_short_name
    FROM tests t
    LEFT JOIN topics tp ON t.topic_id = tp.topic_id
    LEFT JOIN sub_topics st ON t.sub_topic_id = st.sub_topic_id
    LEFT JOIN (
      SELECT id, MAX(full_name) as full_name, MAX(short_name) as short_name 
      FROM departments GROUP BY id
    ) d ON t.department_id = d.id
    WHERE t.added_by = 772
    ORDER BY t.created_at DESC
  `;

db.query(sql, [], (err, results) => {
  if (err) {
    console.error('ERROR:', err);
  } else {
    console.log('SUCCESS:', results.length);
  }
  process.exit();
});
