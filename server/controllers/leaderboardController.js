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
             COALESCE(ROUND(AVG(st.score), 2), 0) AS average_score,
             COALESCE(AVG(LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time))), 0) as avg_time_seconds,
             RANK() OVER (ORDER BY COALESCE(ROUND(AVG(st.score), 2), 0) DESC, COALESCE(AVG(LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time))), 999999) ASC) as rank
      FROM users u
      LEFT JOIN student_tests st ON u.id = st.student_id AND st.status = 'completed' AND st.end_time IS NOT NULL
      LEFT JOIN tests t ON st.test_id = t.test_id
      LEFT JOIN (
        SELECT id, MAX(full_name) as full_name, MAX(short_name) as short_name 
        FROM departments GROUP BY id
      ) d ON u.department_id = d.id
      WHERE u.role_id = 1 AND u.department_id = ?
      GROUP BY u.id, u.name, u.roll_no, d.short_name, u.year
      ORDER BY rank ASC
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
      // Test-wise leaderboard: All eligible students (including misses)
      sql = `
        SELECT u.id, u.name, u.roll_no, d.short_name AS department, u.year,
               COALESCE(st.score, 0) as average_score,
               ROUND((COALESCE(st.score, 0) / 100) * t.num_questions) as raw_score,
               t.num_questions as total_questions,
               GREATEST(1, LEAST(t.duration_minutes * 60, COALESCE(TIMESTAMPDIFF(SECOND, st.start_time, st.end_time), 999999))) as time_taken_seconds,
               RANK() OVER (ORDER BY COALESCE(st.score, 0) DESC, GREATEST(1, LEAST(t.duration_minutes * 60, COALESCE(TIMESTAMPDIFF(SECOND, st.start_time, st.end_time), 999999))) ASC) as rank_position,
               CASE WHEN st.status = 'completed' THEN 'Completed' ELSE 'Missed' END as test_status
        FROM users u
        INNER JOIN tests t ON t.test_id = ?
        LEFT JOIN student_tests st ON u.id = st.student_id AND st.test_id = t.test_id AND st.status = 'completed'
        LEFT JOIN (
          SELECT id, MAX(full_name) as full_name, MAX(short_name) as short_name 
          FROM departments GROUP BY id
        ) d ON u.department_id = d.id
        WHERE u.role_id = 1 
          AND (t.department_id IS NULL OR t.department_id = u.department_id)
          AND (t.year IS NULL OR t.year = u.year)
        ORDER BY rank_position ASC
      `;
      params = [test_id];
    } else {
      // Overall leaderboard: Dynamic calculation
      sql = `
        SELECT u.id, u.name, u.roll_no, d.short_name AS department, u.year,
               COALESCE(ROUND(AVG(st.score), 2), 0) AS average_score,
               COALESCE(AVG(LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time))), 0) as avg_time_seconds,
               RANK() OVER (ORDER BY COALESCE(ROUND(AVG(st.score), 2), 0) DESC, COALESCE(AVG(LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time))), 999999) ASC) as rank_position
        FROM users u
        LEFT JOIN student_tests st ON u.id = st.student_id AND st.status = 'completed' AND st.end_time IS NOT NULL
        LEFT JOIN tests t ON st.test_id = t.test_id
        LEFT JOIN (
          SELECT id, MAX(full_name) as full_name, MAX(short_name) as short_name 
          FROM departments GROUP BY id
        ) d ON u.department_id = d.id
        WHERE u.role_id = 1
        GROUP BY u.id, u.name, u.roll_no, d.short_name, u.year
        ORDER BY rank_position ASC
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
        avatar: (row.name && row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)) || 'ST',
        status: row.test_status || 'Completed'
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
  const { date } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let sql, params;

  if (roleId == 1 || !roleId) { // Student (or fallback)
    // Get ALL active tests available to the student's department and year
    sql = `
      SELECT t.test_id as id, t.title, t.date
      FROM tests t
      INNER JOIN users u ON u.id = ?
      WHERE (t.department_id IS NULL OR t.department_id = u.department_id)
        AND (t.year IS NULL OR t.year = u.year)
        AND t.is_active = 1
        ${date ? 'AND DATE(t.date) = ?' : ''}
      ORDER BY t.date DESC, t.created_at DESC
    `;
    params = date ? [userId, date] : [userId];
  } else if (roleId == 2) { // Faculty
    // Get tests the faculty has created
    sql = `
      SELECT test_id as id, title, date
      FROM tests
      WHERE added_by = ?
        ${date ? 'AND DATE(date) = ?' : ''}
      ORDER BY date DESC, created_at DESC
    `;
    params = date ? [userId, date] : [userId];
  } else { // Admin or others
    sql = `
      SELECT test_id as id, title, date
      FROM tests
      ${date ? 'WHERE DATE(date) = ?' : ''}
      ORDER BY date DESC, created_at DESC
    `;
    params = date ? [date] : [];
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

