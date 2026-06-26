const db = require('../config/conn');

// ------------------------------------------------------------------
// GET /api/dept/superadmin-stats
// Returns aggregate counts for the SuperAdmin dashboard cards.
// No auth required (public admin stats endpoint).
// ------------------------------------------------------------------
exports.getDashboardStats = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM departments)                                     AS departments,
      (SELECT COUNT(*) FROM users WHERE role_id = 2)                        AS faculty,
      (SELECT COUNT(*) FROM users WHERE role_id = 1)                        AS students,
      (SELECT COUNT(*) FROM tests WHERE is_active = 1)                      AS activeTests,
      (SELECT COUNT(*) FROM student_tests WHERE status = 'completed')        AS reports,
      (SELECT COALESCE(ROUND(AVG(score),1),0)
         FROM student_tests WHERE status='completed')                        AS avgScore,
      (SELECT COUNT(*) FROM tests)                                           AS totalTests
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('SuperAdmin stats error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    const row = results[0] || {};
    res.json({
      success: true,
      stats: {
        departments:  row.departments  || 0,
        faculty:      row.faculty      || 0,
        students:     row.students     || 0,
        activeTests:  row.activeTests  || 0,
        reports:      row.reports      || 0,
        avgScore:     row.avgScore     || 0,
        totalTests:   row.totalTests   || 0,
      }
    });
  });
};

// ------------------------------------------------------------------
// GET /api/dept/superadmin/tests
// Returns ALL tests (not filtered by added_by).
// ------------------------------------------------------------------
exports.getAllTests = (req, res) => {
  const sql = `
    SELECT
      t.test_id, t.title, t.description, t.subject,
      t.num_questions, t.department_id, t.year,
      t.date, t.time_slot, t.duration_minutes,
      t.created_at, t.is_active, t.total_marks,
      t.topic_id, t.sub_topic_id,
      d.full_name  AS department_name,
      d.short_name AS dept_short_name,
      u.name       AS created_by_name,
      tp.title     AS topic_title,
      st.title     AS sub_topic_title,
      (SELECT COUNT(*) FROM student_tests WHERE test_id = t.test_id AND status='completed') AS completions
    FROM tests t
    LEFT JOIN departments  d  ON t.department_id   = d.id
    LEFT JOIN users        u  ON t.added_by         = u.id
    LEFT JOIN topics       tp ON t.topic_id         = tp.topic_id
    LEFT JOIN sub_topics   st ON t.sub_topic_id     = st.sub_topic_id
    ORDER BY t.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('SuperAdmin getAllTests error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json({ success: true, tests: results });
  });
};

// ------------------------------------------------------------------
// POST /api/dept/superadmin/tests
// Create a test. added_by is read from body (superadmin can set it)
// or defaults to a special system user id (1).
// ------------------------------------------------------------------
exports.createTestAdmin = (req, res) => {
  const {
    title, description, subject, topic_id, sub_topic_id,
    num_questions, department_id, year, date, time_slot,
    duration_minutes, is_active, total_marks, added_by, question_ids
  } = req.body;

  if (!title || !num_questions || !duration_minutes) {
    return res.status(400).json({ error: 'Required: title, num_questions, duration_minutes' });
  }

  const creatorId = added_by || 1; // fallback to admin user
  const marks = total_marks || num_questions;

  const sql = `
    INSERT INTO tests
      (title, description, subject, added_by, topic_id, sub_topic_id,
       num_questions, department_id, year, date, time_slot,
       duration_minutes, is_active, total_marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    title,
    description || null,
    subject || title,
    creatorId,
    topic_id || null,
    sub_topic_id || null,
    num_questions,
    department_id || null,
    year || null,
    date || null,
    time_slot || null,
    duration_minutes,
    is_active !== undefined ? is_active : 0,
    marks
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('SuperAdmin createTest error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    const testId = result.insertId;

    if (question_ids && Array.isArray(question_ids) && question_ids.length > 0) {
      const qValues = question_ids.map(qid => [testId, qid]);
      const qSql = 'INSERT INTO test_questions (test_id, question_id) VALUES ?';
      db.query(qSql, [qValues], (qErr) => {
        if (qErr) {
          console.error('SuperAdmin assign questions error:', qErr);
          return res.json({
            success: true,
            test_id: testId,
            message: 'Test created, but failed to assign questions',
            error: qErr.message
          });
        }
        res.json({
          success: true,
          test_id: testId,
          message: 'Test created and questions assigned successfully'
        });
      });
    } else {
      res.json({
        success: true,
        test_id: testId,
        message: 'Test created successfully'
      });
    }
  });
};

// ------------------------------------------------------------------
// POST /api/dept/superadmin/tests/:test_id/questions
// Set specific questions for a test (SuperAdmin).
// ------------------------------------------------------------------
exports.assignQuestionsAdmin = (req, res) => {
  const { test_id } = req.params;
  const { question_ids } = req.body;

  if (!test_id) return res.status(400).json({ error: 'Test ID required' });
  if (!question_ids || !Array.isArray(question_ids)) {
    return res.status(400).json({ error: 'question_ids array required' });
  }

  // Delete existing first
  db.query('DELETE FROM test_questions WHERE test_id = ?', [test_id], (err) => {
    if (err) {
      console.error('SuperAdmin delete test_questions error:', err);
      return res.status(500).json({ error: 'Failed to clear existing questions', details: err.message });
    }

    if (question_ids.length === 0) {
      return res.json({ success: true, message: 'All questions cleared from test' });
    }

    const qValues = question_ids.map(qid => [test_id, qid]);
    const qSql = 'INSERT INTO test_questions (test_id, question_id) VALUES ?';
    db.query(qSql, [qValues], (qErr) => {
      if (qErr) {
        console.error('SuperAdmin assign questions error:', qErr);
        return res.status(500).json({ error: 'Failed to assign questions', details: qErr.message });
      }
      res.json({ success: true, message: 'Questions assigned successfully' });
    });
  });
};

// ------------------------------------------------------------------
// DELETE /api/dept/superadmin/tests/:test_id
// Delete any test regardless of added_by.
// ------------------------------------------------------------------
exports.deleteTestAdmin = (req, res) => {
  const { test_id } = req.params;
  if (!test_id) return res.status(400).json({ error: 'Test ID required' });

  // Delete associated student_tests first to avoid FK violations
  db.query('DELETE FROM student_tests WHERE test_id = ?', [test_id], (err) => {
    if (err) {
      console.error('SuperAdmin delete student_tests error:', err);
      return res.status(500).json({ error: 'Failed to remove test sessions', details: err.message });
    }
    db.query('DELETE FROM test_questions WHERE test_id = ?', [test_id], (err2) => {
      if (err2) {
        console.error('SuperAdmin delete test_questions error:', err2);
        // Continue even if test_questions table doesn't exist
      }
      db.query('DELETE FROM tests WHERE test_id = ?', [test_id], (err3, result) => {
        if (err3) {
          console.error('SuperAdmin deleteTest error:', err3);
          return res.status(500).json({ error: 'Database error', details: err3.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Test not found' });
        }
        res.json({ success: true, message: 'Test deleted successfully' });
      });
    });
  });
};

// ------------------------------------------------------------------
// PUT /api/dept/superadmin/tests/:test_id/toggle
// Toggle is_active for any test.
// ------------------------------------------------------------------
exports.toggleTestAdmin = (req, res) => {
  const { test_id } = req.params;
  if (!test_id) return res.status(400).json({ error: 'Test ID required' });

  db.query('SELECT is_active FROM tests WHERE test_id = ?', [test_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Test not found' });

    const newStatus = rows[0].is_active ? 0 : 1;
    db.query('UPDATE tests SET is_active = ? WHERE test_id = ?', [newStatus, test_id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Database error', details: err2.message });
      res.json({ success: true, is_active: newStatus });
    });
  });
};

// ------------------------------------------------------------------
// GET /api/dept/superadmin/reports
// Overall platform analytics for SuperAdmin.
// ------------------------------------------------------------------
exports.getPlatformReports = (req, res) => {
  const sql = `
    SELECT
      COUNT(DISTINCT st.student_test_id)                                        AS totalAttempts,
      COUNT(DISTINCT CASE WHEN st.status='completed' THEN st.student_test_id END) AS completed,
      COALESCE(ROUND(AVG(CASE WHEN st.status='completed' THEN st.score END),1),0) AS avgScore,
      COALESCE(ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN st.status='completed' AND st.score>=50 THEN st.student_test_id END) /
        NULLIF(COUNT(DISTINCT CASE WHEN st.status='completed' THEN st.student_test_id END),0)
      ,1),0)                                                                     AS passRate,
      COUNT(DISTINCT st.student_id)                                              AS uniqueStudents,
      COUNT(DISTINCT st.test_id)                                                 AS uniqueTests
    FROM student_tests st
  `;

  const deptSql = `
    SELECT d.full_name AS department, d.short_name,
      COUNT(DISTINCT st.student_test_id) AS attempts,
      COALESCE(ROUND(AVG(CASE WHEN st.status='completed' THEN st.score END),1),0) AS avgScore
    FROM departments d
    LEFT JOIN users u ON u.department_id = d.id AND u.role_id = 1
    LEFT JOIN student_tests st ON st.student_id = u.id AND st.status='completed'
    GROUP BY d.id, d.full_name, d.short_name
    ORDER BY avgScore DESC
  `;

  db.query(sql, (err, overallResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    db.query(deptSql, (err2, deptResults) => {
      if (err2) {
        return res.status(500).json({ error: 'Database error', details: err2.message });
      }
      res.json({
        success: true,
        overall: overallResults[0] || {},
        byDepartment: deptResults || []
      });
    });
  });
};
