const db = require('../config/conn');

// GET /api/leaderboard/faculty
// Returns top 10 students by total score for the faculty's department
exports.getFacultyLeaderboard = (req, res) => {
  const facultyId = req.user?.id;
  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }
  // Get faculty's department
  const deptSql = 'SELECT department_id FROM users WHERE id = ? AND role_id = 2';
  db.query(deptSql, [facultyId], (err, deptResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (!deptResults.length) {
      return res.status(404).json({ error: 'Faculty not found or unauthorized' });
    }
    const departmentId = deptResults[0].department_id;
    const sql = `
      SELECT u.id, u.name, u.roll_no, d.short_name AS department, u.year,
             l.average_score,
             (l.total_time_seconds / l.total_tests) as avg_time_seconds,
             l.rank_position as rank
      FROM leaderboard l
      INNER JOIN users u ON l.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role_id = 1 AND u.department_id = ?
      ORDER BY l.rank_position ASC
      LIMIT 10
    `;
    db.query(sql, [departmentId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err });
      }
      // Add rank and avatar fallback
      const leaderboard = results.map((row, idx) => {
        // Calculate actual time taken in MM:SS format
        let formattedTime = null;
        if (row.avg_time_seconds !== undefined && row.avg_time_seconds !== null) {
          const secs = Math.max(0, Math.floor(Number(row.avg_time_seconds)));
          const minutes = Math.floor(secs / 60);
          const remainingSeconds = secs % 60;
          formattedTime = `${minutes}m ${remainingSeconds}s`;
        }
        return {
          rank: idx + 1,
          name: row.name,
          average_score: row.average_score !== null ? Number(row.average_score).toFixed(2) : "0.00",
          department: row.department || '',
          year: row.year ? `${row.year} Year` : '',
          time_taken: formattedTime,
          avatar: (row.name && row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)) || 'ST'
        };
      });
      res.json({ success: true, leaderboard });
    });
  });
};

// GET /api/leaderboard
// Returns top students by score (can be filtered by test_id)
exports.getLeaderboard = (req, res) => {
  const { test_id } = req.query;

  let sql, params;

  if (test_id) {
    // Test-wise leaderboard: Best attempt per student (Ranked by score then time)
    sql = `
      SELECT u.id, u.name, u.roll_no, d.short_name AS department, u.year,
             at.raw_score,
             at.total_questions,
             at.time_taken_seconds
      FROM (
        SELECT st.student_id,
               (SELECT COUNT(DISTINCT sa.question_id) 
                FROM student_answers sa 
                INNER JOIN test_questions tq ON sa.question_id = tq.question_id
                WHERE sa.student_test_id = st.student_test_id 
                AND tq.test_id = st.test_id
                AND sa.is_correct = 1) as raw_score,
               (SELECT COUNT(*) FROM test_questions WHERE test_id = st.test_id) as total_questions,
               GREATEST(1, LEAST(t.duration_minutes * 60, 
                 CASE 
                   WHEN st.end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, st.start_time, st.end_time)
                   ELSE TIMESTAMPDIFF(SECOND, st.start_time, NOW())
                 END
               )) as time_taken_seconds,
               ROW_NUMBER() OVER (
                 PARTITION BY st.student_id 
                 ORDER BY 
                   (SELECT COUNT(DISTINCT sa2.question_id) FROM student_answers sa2 WHERE sa2.student_test_id = st.student_test_id AND sa2.is_correct = 1) DESC,
                   GREATEST(1, TIMESTAMPDIFF(SECOND, st.start_time, IFNULL(st.end_time, NOW()))) ASC
               ) as rn
        FROM student_tests st
        INNER JOIN tests t ON st.test_id = t.test_id
        WHERE st.test_id = ?
      ) at
      INNER JOIN users u ON at.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE at.rn = 1 AND u.role_id = 1
      ORDER BY at.raw_score DESC, at.time_taken_seconds ASC
    `;
    params = [test_id];
  } else {
    // Overall leaderboard
    // Overall leaderboard: Read from the persisted leaderboard table
    sql = `
      SELECT u.id, u.name, u.roll_no, d.short_name AS department, u.year,
             l.average_score,
             (l.total_time_seconds / l.total_tests) as avg_time_seconds,
             l.rank_position as rank
      FROM leaderboard l
      INNER JOIN users u ON l.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role_id = 1
      ORDER BY l.rank_position ASC
    `;
    params = [];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Leaderboard query error:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    // Add rank and avatar fallback
    const leaderboard = results.map((row, idx) => {
      // Calculate actual time taken in MM:SS format
      let formattedTime = null;
      const totalSecs = row.time_taken_seconds !== undefined ? row.time_taken_seconds : row.avg_time_seconds;

      if (totalSecs !== undefined && totalSecs !== null) {
        const secs = Math.max(0, Math.floor(Number(totalSecs)));
        const minutes = Math.floor(secs / 60);
        const remainingSeconds = secs % 60;
        formattedTime = `${minutes}m ${remainingSeconds}s`;
      }

      return {
        rank: idx + 1,
        name: row.name,
        // Safety: Ensure displayed score never exceeds the total question count
        average_score: row.raw_score !== undefined ? Math.min(row.raw_score, row.total_questions) : (row.average_score !== null ? Number(row.average_score).toFixed(2) : "0.00"),
        total_questions: row.total_questions,
        department: row.department || '',
        year: row.year ? `${row.year} Year` : '',
        time_taken: formattedTime,
        avatar: (row.name && row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)) || 'ST'
      };
    });
    res.json({ success: true, leaderboard });
  });
};

// GET /api/leaderboard/tests
// Returns list of tests for the leaderboard selection dropdown
exports.getLeaderboardTests = (req, res) => {
  const userId = req.user?.id;
  const roleId = req.user?.role_id; // Using role_id from token

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let sql, params;

  if (roleId == 1) { // Student
    // Get tests the student has attended and completed
    sql = `
      SELECT DISTINCT t.test_id as id, t.title, t.date
      FROM tests t
      INNER JOIN student_tests st ON t.test_id = st.test_id
      WHERE st.student_id = ? AND st.status = 'completed' AND st.end_time IS NOT NULL
      ORDER BY t.date DESC, t.created_at DESC
    `;
    params = [userId];
  } else if (roleId == 2) { // Faculty
    // Get tests the faculty has created
    sql = `
      SELECT test_id as id, title, date
      FROM tests
      WHERE added_by = ?
      ORDER BY date DESC, created_at DESC
    `;
    params = [userId];
  } else { // Admin or others
    sql = `
      SELECT test_id as id, title, date
      FROM tests
      ORDER BY date DESC, created_at DESC
    `;
    params = [];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.json({ success: true, tests: results });
  });
};

// GET /api/leaderboard/student-rank
// Returns individual student's rank within their department and year
exports.getStudentRank = (req, res) => {
  const studentId = req.user?.id;
  if (!studentId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  // Get student's department and year
  const userSql = 'SELECT department_id, year FROM users WHERE id = ?';
  db.query(userSql, [studentId], (err, userResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (!userResults.length) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { department_id, year } = userResults[0];

    if (!department_id || !year) {
      return res.json({
        success: true,
        rank: '--',
        totalStudents: 0,
        averageScore: 0,
        message: 'Department or year not assigned'
      });
    }

    // Calculate ranking for all students in the same department and year
    // Primary sort: Average Score (Desc)
    // Secondary sort: Average Time (Asc)
    const rankingSql = `
      SELECT u.id, 
             COALESCE(ROUND(AVG(st.score), 2), 0) AS avg_score,
             COALESCE(AVG(LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time))), 999999) as avg_time
      FROM users u
      LEFT JOIN student_tests st ON u.id = st.student_id AND st.status = 'completed' AND st.end_time IS NOT NULL
      LEFT JOIN tests t ON st.test_id = t.test_id
      WHERE u.department_id = ? AND u.year = ? AND u.role_id = 1
      GROUP BY u.id
      ORDER BY avg_score DESC, avg_time ASC
    `;

    db.query(rankingSql, [department_id, year], (err, rankResults) => {
      if (err) {
        return res.status(500).json({ error: 'Ranking calculation error', details: err });
      }

      const studentRankIdx = rankResults.findIndex(r => r.id === studentId);
      const studentData = rankResults[studentRankIdx];

      res.json({
        success: true,
        rank: studentRankIdx !== -1 ? studentRankIdx + 1 : '--',
        totalStudents: rankResults.length,
        averageScore: studentData ? Number(studentData.avg_score).toFixed(2) : "0.00",
        studentId: studentId
      });
    });
  });
};

