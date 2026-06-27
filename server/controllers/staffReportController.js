const db = require('../config/conn');

// Helper: check if the requesting user is a SuperAdmin (role_id 5)
function isSuperAdmin(req) {
  return Number(req.user?.role_id) === 5;
}

// 1. Individual Student Report
exports.getStudentsByFaculty = (req, res) => {
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const superAdmin = isSuperAdmin(req);

  const sql = superAdmin
    ? `
    SELECT DISTINCT u.id, u.name, u.email, u.roll_no as rollNo, 
           d.short_name as department, u.year
    FROM users u
    INNER JOIN student_tests st ON u.id = st.student_id
    INNER JOIN tests t ON st.test_id = t.test_id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role_id = '1'
    ORDER BY u.name
    `
    : `
    SELECT DISTINCT u.id, u.name, u.email, u.roll_no as rollNo, 
           d.short_name as department, u.year
    FROM users u
    INNER JOIN student_tests st ON u.id = st.student_id
    INNER JOIN tests t ON st.test_id = t.test_id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE t.added_by = ? AND u.role_id = '1'
    ORDER BY u.name
    `;

  const params = superAdmin ? [] : [facultyId];

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    res.json({ success: true, students: results });
  });
};

exports.getStudentReport = (req, res) => {
  const { studentId } = req.params;
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const sql = `
    SELECT 
      t.title as test,
      st.start_time as date,
      st.start_time as startTime,
      st.end_time as finishTime,
      (SELECT COUNT(DISTINCT sa.question_id) FROM student_answers sa JOIN questions q ON sa.question_id = q.question_id WHERE sa.student_test_id = st.student_test_id AND sa.answer = q.correct_option) as score,
      t.num_questions as maxScore,
      ROUND(st.score, 2) as accuracy,
      LEAST(t.duration_minutes, 
        CASE 
          WHEN st.end_time IS NOT NULL AND st.start_time IS NOT NULL 
          THEN TIMESTAMPDIFF(MINUTE, st.start_time, st.end_time)
          ELSE t.duration_minutes
        END
      ) as timeTaken,
      CASE 
        WHEN st.end_time IS NOT NULL AND st.start_time IS NOT NULL 
        THEN CONCAT(
          LEAST(t.duration_minutes, TIMESTAMPDIFF(MINUTE, st.start_time, st.end_time)), 'm'
        )
        ELSE 'Auto-submitted' 
      END as duration,
      t.duration_minutes as totalTime,
      st.status,
      (
        SELECT COUNT(*) + 1 
        FROM student_tests st2 
        JOIN tests t2 ON st2.test_id = t2.test_id
        WHERE st2.test_id = st.test_id 
        AND st2.status = 'completed'
        AND (
          st2.score > st.score 
          OR (
            st2.score = st.score 
            AND LEAST(t2.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st2.start_time, st2.end_time)) < 
                LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time))
          )
        )
      ) as \`rank\`,
      (
        SELECT COUNT(*) 
        FROM student_tests st3 
        WHERE st3.test_id = st.test_id AND st3.status = 'completed'
      ) as totalStudents
    FROM student_tests st
    INNER JOIN tests t ON st.test_id = t.test_id
    WHERE st.student_id = ? AND t.added_by = ? AND st.status = 'completed' AND st.end_time IS NOT NULL
    ORDER BY st.start_time DESC
  `;

  db.query(sql, [studentId, facultyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    // Add weak areas analysis (placeholder - would need more complex analysis)
    const testResults = results.map(test => ({
      ...test,
      weakAreas: ['Loops', 'Functions'] // This would be calculated based on question-wise performance
    }));

    res.json({ success: true, testResults });
  });
};

// Get detailed test history for a student with time calculations
exports.getStudentTestHistory = (req, res) => {
  const { studentId } = req.params;
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const sql = `
    SELECT 
      st.student_test_id,
      t.title as testTitle,
      t.date as testDate,
      st.start_time as startTime,
      st.end_time as finishTime,
      ROUND((st.score / 100) * t.num_questions) as rawScore,
      t.num_questions as totalQuestions,
      LEAST(100, ROUND(st.score, 2)) as percentage,
      st.status,
      CASE 
        WHEN st.end_time IS NOT NULL AND st.start_time IS NOT NULL 
        THEN TIMESTAMPDIFF(SECOND, st.start_time, st.end_time)
        ELSE NULL 
      END as durationSeconds,
      CASE 
        WHEN st.end_time IS NOT NULL AND st.start_time IS NOT NULL 
        THEN CONCAT(
          FLOOR(TIMESTAMPDIFF(MINUTE, st.start_time, st.end_time) / 60), 'h ',
          MOD(TIMESTAMPDIFF(MINUTE, st.start_time, st.end_time), 60), 'm ',
          MOD(TIMESTAMPDIFF(SECOND, st.start_time, st.end_time), 60), 's'
        )
        ELSE 'Not completed' 
      END as formattedDuration,
      t.duration_minutes as allocatedTime,
      CASE 
        WHEN st.end_time IS NOT NULL AND st.start_time IS NOT NULL 
        THEN ROUND((TIMESTAMPDIFF(MINUTE, st.start_time, st.end_time) / t.duration_minutes) * 100, 2)
        ELSE NULL 
      END as timeUtilization
    FROM student_tests st
    INNER JOIN tests t ON st.test_id = t.test_id
    WHERE st.student_id = ? AND t.added_by = ?
    ORDER BY t.date DESC, st.start_time DESC
  `;

  db.query(sql, [studentId, facultyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    // Format the results with additional calculated fields
    const testHistory = results.map(test => ({
      ...test,
      startTimeFormatted: test.startTime ? new Date(test.startTime).toLocaleString() : null,
      finishTimeFormatted: test.finishTime ? new Date(test.finishTime).toLocaleString() : null,
      isCompleted: test.status === 'completed' || test.finishTime !== null,
      timeTakenMinutes: test.durationSeconds ? Math.floor(test.durationSeconds / 60) : null,
      efficiency: test.percentage && test.durationSeconds ?
        Math.round((test.percentage / (test.durationSeconds / 60)) * 100) / 100 : null // Score per minute
    }));

    res.json({
      success: true,
      testHistory,
      summary: {
        totalTests: results.length,
        completedTests: results.filter(t => t.finishTime).length,
        averageScore: results.length > 0 ?
          Math.round(results.reduce((sum, t) => sum + (t.percentage || 0), 0) / results.length * 100) / 100 : 0,
        averageDuration: results.filter(t => t.durationSeconds).length > 0 ?
          Math.round(results.filter(t => t.durationSeconds)
            .reduce((sum, t) => sum + t.durationSeconds, 0) /
            results.filter(t => t.durationSeconds).length / 60 * 100) / 100 + ' minutes' : 'N/A'
      }
    });
  });
};

// 2. Test-wise Report
exports.getTestsByFaculty = (req, res) => {
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const superAdmin = isSuperAdmin(req);

  const sql = superAdmin
    ? `
    SELECT t.test_id as id, t.title, t.date, t.duration_minutes as duration,
           COUNT(st.student_id) as students,
           t.num_questions as totalQuestions,
           u.name as facultyName
    FROM tests t
    LEFT JOIN student_tests st ON t.test_id = st.test_id
    JOIN users u ON t.added_by = u.id
    GROUP BY t.test_id, t.title, t.date, t.duration_minutes, t.num_questions, u.name
    ORDER BY t.date DESC
    `
    : `
    SELECT t.test_id as id, t.title, t.date, t.duration_minutes as duration,
           COUNT(st.student_id) as students,
           t.num_questions as totalQuestions
    FROM tests t
    LEFT JOIN student_tests st ON t.test_id = st.test_id
    WHERE t.added_by = ?
    GROUP BY t.test_id, t.title, t.date, t.duration_minutes, t.num_questions
    ORDER BY t.date DESC
    `;

  const params = superAdmin ? [] : [facultyId];

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    res.json({ success: true, tests: results });
  });
};

exports.getTestAnalysis = (req, res) => {
  const { testId } = req.params;
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const superAdmin = isSuperAdmin(req);

  // Test info and stats — SuperAdmin has no added_by restriction
  const testInfoSql = `
    SELECT t.title, t.date, t.num_questions as totalQuestions, t.duration_minutes as duration,
           u.name as facultyName,
           COALESCE(LEAST(t.num_questions, ROUND(AVG((bs.max_score / 100) * t.num_questions), 2)), 0) as avgScore,
           COALESCE(ROUND(AVG(bs.max_score), 2), 0) as avgPercentage,
           COALESCE(LEAST(t.num_questions, ROUND(MAX((bs.max_score / 100) * t.num_questions), 2)), 0) as highestScore,
           COALESCE(LEAST(t.num_questions, ROUND(MIN((bs.max_score / 100) * t.num_questions), 2)), 0) as lowestScore,
           COALESCE(ROUND((COUNT(CASE WHEN bs.max_score >= 60 THEN 1 END) / NULLIF(COUNT(bs.student_id), 0)) * 100, 2), 0) as passRate
    FROM tests t
    JOIN users u ON t.added_by = u.id
    LEFT JOIN (
      SELECT student_id, test_id, MAX(score) as max_score
      FROM student_tests
      WHERE status = 'completed' AND end_time IS NOT NULL
      GROUP BY student_id, test_id
    ) bs ON t.test_id = bs.test_id
    WHERE t.test_id = ? ${superAdmin ? '' : 'AND t.added_by = ?'}
    GROUP BY t.test_id
  `;

  // All Present Students
  const presentStudentsSql = `
    SELECT u.name, u.roll_no as rollNo, d.short_name as department, u.year, 
           LEAST(100, bs.max_score) as original_score,
           LEAST(t.num_questions, ROUND((bs.max_score / 100) * t.num_questions)) as score,
           t.num_questions as total_questions,
           'completed' as status,
           bs.min_duration as timeTaken,
           (
             SELECT COUNT(DISTINCT st2.student_id) + 1 
             FROM student_tests st2 
             WHERE st2.test_id = ? 
             AND st2.status = 'completed'
             AND (
               st2.score > bs.max_score 
               OR (
                 st2.score = bs.max_score 
                 AND TIMESTAMPDIFF(SECOND, st2.start_time, st2.end_time) < bs.min_duration_sec
               )
             )
           ) as \`rank\`
    FROM (
      SELECT student_id, test_id, MAX(score) as max_score, 
             MIN(TIMESTAMPDIFF(SECOND, start_time, end_time)) as min_duration_sec,
             MIN(TIMESTAMPDIFF(SECOND, start_time, end_time)) / 60 as min_duration
      FROM student_tests
      WHERE test_id = ? AND status = 'completed' AND end_time IS NOT NULL
      GROUP BY student_id
    ) bs
    INNER JOIN users u ON bs.student_id = u.id
    INNER JOIN tests t ON bs.test_id = t.test_id
    LEFT JOIN departments d ON u.department_id = d.id
    GROUP BY u.id, u.name, u.roll_no, d.short_name, u.year, bs.max_score, t.num_questions, bs.min_duration, bs.min_duration_sec
    ORDER BY \`rank\` ASC, u.name ASC
  `;

  // Absent Students (Eligible but haven't taken the test)
  const absentStudentsSql = `
    SELECT u.name, u.roll_no as rollNo, d.short_name as department, u.year
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.role_id = 1
      AND u.id NOT IN (SELECT student_id FROM student_tests WHERE test_id = ?)
      AND EXISTS (
        SELECT 1 FROM tests t 
        WHERE t.test_id = ? 
        AND (t.department_id IS NULL OR u.department_id = t.department_id)
        AND (t.year IS NULL OR u.year = t.year)
      )
    GROUP BY u.id, u.name, u.roll_no, d.short_name, u.year
    ORDER BY u.name
  `;

  // Question analysis (SuperAdmin sees all, faculty scoped)
  const questionAnalysisSql = `
    SELECT q.question_text as question,
           COUNT(DISTINCT CASE WHEN sa.answer = q.correct_option THEN st.student_id END) as correctAnswers,
           COUNT(DISTINCT st.student_id) as totalAnswers,
           CASE 
             WHEN COUNT(DISTINCT st.student_id) > 0 THEN
               CASE 
                 WHEN (COUNT(DISTINCT CASE WHEN sa.answer = q.correct_option THEN st.student_id END) / COUNT(DISTINCT st.student_id)) > 0.8 THEN 'Easy'
                 WHEN (COUNT(DISTINCT CASE WHEN sa.answer = q.correct_option THEN st.student_id END) / COUNT(DISTINCT st.student_id)) > 0.5 THEN 'Medium'
                 ELSE 'Hard'
               END
             ELSE 'No Data'
           END as difficulty
    FROM test_questions tq
    INNER JOIN questions q ON tq.question_id = q.question_id
    INNER JOIN tests t ON tq.test_id = t.test_id
    LEFT JOIN student_tests st ON tq.test_id = st.test_id AND st.status = 'completed' AND st.end_time IS NOT NULL
    LEFT JOIN student_answers sa ON st.student_test_id = sa.student_test_id 
      AND tq.question_id = sa.question_id
    WHERE tq.test_id = ? ${superAdmin ? '' : 'AND t.added_by = ?'}
    GROUP BY q.question_id, q.question_text, q.correct_option
    ORDER BY q.question_id
  `;

  // Execute all queries
  const testInfoParams = superAdmin ? [testId] : [testId, facultyId];
  db.query(testInfoSql, testInfoParams, (err, testInfo) => {
    if (err) return res.status(500).json({ error: 'Database error (Info)', details: err });
    if (testInfo.length === 0) return res.status(404).json({ error: 'Test not found' });

    db.query(presentStudentsSql, [testId, testId], (err, presentStudents) => {
      if (err) return res.status(500).json({ error: 'Database error (Present)', details: err });

      db.query(absentStudentsSql, [testId, testId], (err, absentStudents) => {
        if (err) return res.status(500).json({ error: 'Database error (Absent)', details: err });

        const qAnalysisParams = superAdmin ? [testId] : [testId, facultyId];
        db.query(questionAnalysisSql, qAnalysisParams, (err, questionAnalysis) => {
          if (err) return res.status(500).json({ error: 'Database error (Questions)', details: err });

          res.json({
            success: true,
            testAnalysis: {
              testInfo: testInfo[0],
              stats: {
                avgScore: testInfo[0].avgScore || 0,
                avgPercentage: testInfo[0].avgPercentage || 0,
                highestScore: testInfo[0].highestScore || 0,
                lowestScore: testInfo[0].lowestScore || 0,
                passRate: testInfo[0].passRate || 0
              },
              presentStudents: presentStudents || [],
              absentStudents: absentStudents || [],
              topPerformers: (presentStudents || []).slice(0, 10), // Return top 10 unique performers
              questionAnalysis: questionAnalysis || []
            }
          });
        });
      });
    });
  });
};

// 3. Department/Batch Report
exports.getDepartmentReport = (req, res) => {
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const sql = `
    SELECT 
      d.short_name as department,
      COUNT(DISTINCT u.id) as students,
      COUNT(DISTINCT CASE WHEN t.test_id IS NOT NULL THEN st.student_test_id END) as testsAttended,
      COALESCE(LEAST(100, ROUND(AVG(CASE WHEN t.test_id IS NOT NULL THEN st.score END), 0)), 0) as avgScore,
      COALESCE(ROUND((COUNT(CASE WHEN t.test_id IS NOT NULL AND st.score >= 60 THEN 1 END) / NULLIF(COUNT(CASE WHEN t.test_id IS NOT NULL THEN st.student_test_id END), 0)) * 100, 2), 0) as passRate,
      COALESCE(ROUND((COUNT(DISTINCT CASE WHEN t.test_id IS NOT NULL THEN st.student_id END) / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 2), 0) as attendance
    FROM departments d
    LEFT JOIN users u ON d.id = u.department_id AND u.role_id = 1
    LEFT JOIN student_tests st ON u.id = st.student_id AND st.status = 'completed'
    LEFT JOIN tests t ON st.test_id = t.test_id AND t.added_by = ?
    GROUP BY d.id, d.short_name
    ORDER BY d.short_name
  `;

  db.query(sql, [facultyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    res.json({ success: true, departmentData: results });
  });
};

exports.getBatchReport = (req, res) => {
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }



  const sql = `
    SELECT 
      CASE 
        WHEN u.roll_no IS NOT NULL AND LENGTH(u.roll_no) >= 2 THEN 
          CONCAT(d.short_name, ' - ', 
            CASE 
              WHEN u.roll_no REGEXP '^[0-9]{2}' THEN CONCAT('20', LEFT(u.roll_no, 2))
              WHEN u.roll_no REGEXP '^[0-9]{4}' THEN LEFT(u.roll_no, 4)
              ELSE YEAR(u.created_at)
            END
          )
        ELSE CONCAT(d.short_name, ' - ', YEAR(COALESCE(u.created_at, NOW())))
      END as batch,
      COUNT(DISTINCT u.id) as students,
      COUNT(DISTINCT CASE WHEN t.test_id IS NOT NULL THEN st.student_test_id END) as testsAttended,
      COALESCE(LEAST(100, ROUND(AVG(CASE WHEN t.test_id IS NOT NULL THEN st.score END), 0)), 0) as avgScore,
      COALESCE(ROUND((COUNT(CASE WHEN t.test_id IS NOT NULL AND st.score >= 60 THEN 1 END) / NULLIF(COUNT(CASE WHEN t.test_id IS NOT NULL THEN st.student_test_id END), 0)) * 100, 2), 0) as passRate,
      COALESCE(ROUND((COUNT(DISTINCT CASE WHEN t.test_id IS NOT NULL THEN st.student_id END) / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 2), 0) as attendance
    FROM users u
    INNER JOIN departments d ON u.department_id = d.id
    LEFT JOIN student_tests st ON u.id = st.student_id AND st.status = 'completed'
    LEFT JOIN tests t ON st.test_id = t.test_id AND t.added_by = ?
    WHERE u.role_id = 1
    GROUP BY batch
    ORDER BY batch
  `;

  db.query(sql, [facultyId], (err, results) => {
    if (err) {
      console.error('Batch report error:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }

    res.json({ success: true, batchData: results });
  });
};

// 4. Question Analysis Report
exports.getQuestionAnalysis = (req, res) => {
  const { testId } = req.params;
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  // First, get the questions for this test
  const questionsSql = `
    SELECT 
      q.question_id,
      q.question_text as question,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option,
      tq.test_question_id as question_order
    FROM test_questions tq
    INNER JOIN questions q ON tq.question_id = q.question_id
    INNER JOIN tests t ON tq.test_id = t.test_id
    WHERE tq.test_id = ? ${isSuperAdmin(req) ? '' : 'AND t.added_by = ?'}
    ORDER BY tq.test_question_id
  `;

  // Get answer statistics for each question
  const answersSql = `
    SELECT 
      sa.question_id,
      COUNT(DISTINCT sa.student_test_id) as totalAnswers,
      SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as correctAnswers,
      SUM(CASE WHEN sa.answer = 'A' THEN 1 ELSE 0 END) as optionA,
      SUM(CASE WHEN sa.answer = 'B' THEN 1 ELSE 0 END) as optionB,
      SUM(CASE WHEN sa.answer = 'C' THEN 1 ELSE 0 END) as optionC,
      SUM(CASE WHEN sa.answer = 'D' THEN 1 ELSE 0 END) as optionD
    FROM student_answers sa
    INNER JOIN student_tests st ON sa.student_test_id = st.student_test_id
    WHERE st.test_id = ? AND st.status = 'completed' AND st.end_time IS NOT NULL
    GROUP BY sa.question_id
  `;

  const qSqlParams = isSuperAdmin(req) ? [testId] : [testId, facultyId];
  db.query(questionsSql, qSqlParams, (err, questions) => {
    if (err) {
      console.error('Question analysis error (questions):', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }

    if (questions.length === 0) {
      return res.json({ success: true, questionData: [], message: 'No questions found for this test' });
    }

    db.query(answersSql, [testId], (err, answerStats) => {
      if (err) {
        console.error('Question analysis error (answers):', err);
        return res.status(500).json({ error: 'Database error', details: err });
      }

      // Create a map of answer statistics by question_id
      const answerStatsMap = new Map();
      answerStats.forEach(row => {
        answerStatsMap.set(row.question_id, row);
      });

      // Build the question data array
      const questionData = questions.map((q, index) => {
        const stats = answerStatsMap.get(q.question_id) || {
          totalAnswers: 0,
          correctAnswers: 0,
          optionA: 0,
          optionB: 0,
          optionC: 0,
          optionD: 0
        };
        const successRate = stats.totalAnswers > 0
          ? (stats.correctAnswers / stats.totalAnswers)
          : 0;

        // Determine difficulty based on success rate
        let difficulty;
        if (stats.totalAnswers === 0) {
          difficulty = 'No Data';
        } else if (successRate > 0.8) {
          difficulty = 'Easy';
        } else if (successRate > 0.5) {
          difficulty = 'Medium';
        } else {
          difficulty = 'Hard';
        }

        return {
          questionNumber: index + 1,
          question: q.question,
          questionId: q.question_id,
          correctAnswers: stats.correctAnswers || 0,
          totalAnswers: stats.totalAnswers || 0,
          successRate: Math.round(successRate * 100),
          difficulty: difficulty,
          optionDistribution: {
            A: stats.optionA || 0,
            B: stats.optionB || 0,
            C: stats.optionC || 0,
            D: stats.optionD || 0
          },
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d
          },
          correctOption: q.correct_option
        };
      });

      res.json({ success: true, questionData });
    });
  });
};

// 5. Test Progress Report (Live Tests)
exports.getLiveTests = (req, res) => {
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const sql = `
    SELECT 
      t.test_id as id,
      t.title,
      t.date as startTime,
      t.duration_minutes as duration,
      COUNT(DISTINCT st.student_id) as totalStudents,
      COUNT(CASE WHEN st.end_time IS NOT NULL THEN 1 END) as submitted,
      COUNT(CASE 
        WHEN st.end_time IS NULL 
        AND st.start_time IS NOT NULL 
        AND TIMESTAMPDIFF(MINUTE, st.start_time, NOW()) <= t.duration_minutes + 5 
        THEN 1 
      END) as inProgress,
      COUNT(CASE 
        WHEN st.start_time IS NULL 
        AND (st.end_time IS NULL OR TIMESTAMPDIFF(MINUTE, st.start_time, NOW()) > t.duration_minutes + 5)
        THEN 1 
      END) as notStarted
    FROM tests t
    LEFT JOIN student_tests st ON t.test_id = st.test_id
    WHERE t.added_by = ? 
      AND t.is_active = 1 
      AND DATE(t.date) = CURDATE()
    GROUP BY t.test_id, t.title, t.date, t.duration_minutes
    ORDER BY t.date DESC
  `;

  db.query(sql, [facultyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    // Get students currently taking each test
    const liveTestsPromises = results.map(test => {
      return new Promise((resolve, reject) => {
        const studentsSql = `
          SELECT 
            u.name,
            GREATEST(0, t.duration_minutes - TIMESTAMPDIFF(MINUTE, st.start_time, NOW())) as timeLeft,
            ROUND(COALESCE((COUNT(sa.student_answers_id) / NULLIF(t.num_questions, 0)) * 100, 0), 2) as progress
          FROM student_tests st
          INNER JOIN users u ON st.student_id = u.id
          INNER JOIN tests t ON st.test_id = t.test_id
          LEFT JOIN student_answers sa ON st.student_test_id = sa.student_test_id
          WHERE st.test_id = ? 
            AND st.end_time IS NULL 
            AND st.start_time IS NOT NULL
            AND TIMESTAMPDIFF(MINUTE, st.start_time, NOW()) <= t.duration_minutes + 5
          GROUP BY st.student_test_id, u.name, st.start_time, t.duration_minutes, t.num_questions
          LIMIT 10
        `;

        db.query(studentsSql, [test.id], (err, students) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              ...test,
              studentsInProgress: students || []
            });
          }
        });
      });
    });

    Promise.all(liveTestsPromises)
      .then(liveTests => {
        res.json({ success: true, liveTests });
      })
      .catch(err => {
        res.status(500).json({ error: 'Database error', details: err });
      });
  });
};

// Dashboard Statistics
exports.getDashboardStats = (req, res) => {
  const facultyId = req.user?.id;

  if (!facultyId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const sql = `
    SELECT 
      COUNT(DISTINCT t.test_id) as quizzesCreated,
      COUNT(DISTINCT CASE WHEN st.status = 'completed' THEN st.student_id END) as studentsEvaluated,
      COALESCE(LEAST(100, ROUND(AVG(CASE WHEN st.status = 'completed' THEN st.score END), 0)), 0) as avgPerformance,
      COUNT(DISTINCT CASE WHEN t.is_active = 1 THEN t.test_id END) as activeQuizzes
    FROM tests t
    LEFT JOIN student_tests st ON t.test_id = st.test_id
    WHERE t.added_by = ?
  `;

  db.query(sql, [facultyId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    const stats = results[0] || { quizzesCreated: 0, studentsEvaluated: 0, avgPerformance: 0, activeQuizzes: 0 };
    // Ensure null values are converted to 0
    if (stats.quizzesCreated === null) stats.quizzesCreated = 0;
    if (stats.studentsEvaluated === null) stats.studentsEvaluated = 0;
    if (stats.avgPerformance === null) stats.avgPerformance = 0;
    if (stats.activeQuizzes === null) stats.activeQuizzes = 0;

    res.json({ success: true, stats: stats });
  });
};