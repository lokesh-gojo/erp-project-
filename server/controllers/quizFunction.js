
const db = require('../config/conn');

exports.getQuizQuestions = (req, res) => {
  const { testId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  if (!testId) {
    return res.status(400).json({ error: 'Test ID is required' });
  }

  const testQuery = `
    SELECT t.test_id, t.title, t.description, t.subject, t.num_questions, 
           t.duration_minutes, t.is_active, t.department_id, t.year, t.topic_id, t.sub_topic_id,
           u.year as student_year, u.department_id as student_dept_id
    FROM tests t
    JOIN users u ON u.id = ?
    WHERE t.test_id = ? AND t.is_active = 1 
    AND t.department_id = u.department_id AND t.year = u.year
  `;

  db.query(testQuery, [userId, testId], (err, testResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    if (testResults.length === 0) {
      return res.status(404).json({ error: 'Test not found or not accessible' });
    }

    const test = testResults[0];

    // Use only the questions explicitly assigned to this test (from test_questions table)
    const questionsQuery = `
      SELECT q.question_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.mark,
             st.title as sub_topic_title, tp.title as topic_title
      FROM test_questions tq
      JOIN questions q ON tq.question_id = q.question_id
      LEFT JOIN sub_topics st ON q.sub_topic_id = st.sub_topic_id
      LEFT JOIN topics tp ON st.topic_id = tp.topic_id
      WHERE tq.test_id = ?
      ORDER BY RAND(?)
      LIMIT ?
    `;

    db.query(questionsQuery, [testId, userId + parseInt(testId), test.num_questions], (err, questionResults) => {
      if (err) {
        return res.status(500).json({ error: 'Database error while fetching questions', details: err });
      }

      const returnFormatted = (results) => results.map(row => ({
        question_id: row.question_id,
        text: row.question_text,
        options: [row.option_a, row.option_b, row.option_c, row.option_d],
        marks: row.mark || 1,
        sub_topic_title: row.sub_topic_title,
        topic_title: row.topic_title
      }));

      const sendResponse = (questionsArray) => {
        const formattedQuestions = returnFormatted(questionsArray);
        res.json({
          success: true,
          test: {
            test_id: test.test_id,
            title: test.title,
            description: test.description,
            subject: test.subject,
            duration_minutes: test.duration_minutes,
            total_questions: test.num_questions
          },
          questions: formattedQuestions,
          total_questions: formattedQuestions.length
        });
      };

      if (questionResults.length === 0) {
        // fallback: pick random from same subtopic
        const fallbackQuery = `
          SELECT q.question_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.mark,
                 st.title as sub_topic_title, tp.title as topic_title
          FROM questions q
          LEFT JOIN sub_topics st ON q.sub_topic_id = st.sub_topic_id
          LEFT JOIN topics tp ON st.topic_id = tp.topic_id
          WHERE q.sub_topic_id = ?
          ORDER BY RAND(?)
          LIMIT ?
        `;
        db.query(fallbackQuery, [test.sub_topic_id, userId + parseInt(testId), test.num_questions], (fbErr, fbResults) => {
          if (fbErr) {
            return res.status(500).json({ error: 'Database error while fetching fallback questions', details: fbErr });
          }
          sendResponse(fbResults);
        });
      } else {
        sendResponse(questionResults);
      }
    });
  });
};

exports.startTest = (req, res) => {
  const { testId } = req.params;
  const userId = req.user?.id;

  console.log('Start test called with:', { testId, userId });

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  const checkQuery = `
    SELECT student_test_id, status FROM student_tests 
    WHERE student_id = ? AND test_id = ?
  `;

  db.query(checkQuery, [userId, testId], (err, existingResults) => {
    if (err) {
      console.error('Check existing session error:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }

    console.log('Existing sessions found:', existingResults);

    // Ignore invalid sessions (id 0 or empty status)
    const validSession = existingResults.find(s => s.student_test_id && s.student_test_id !== 0 && s.status);

    if (validSession) {
      console.log('Found valid existing session:', validSession);
      // If already completed, return special response
      if (validSession.status === 'completed') {
        return res.status(200).json({
          success: false,
          already_completed: true,
          message: 'This test has already been completed. You cannot retake this test.',
          title: 'Test Already Completed'
        });
      }
      return res.json({
        success: true,
        message: 'Test session already exists',
        student_test_id: validSession.student_test_id
      });
    }

    // Create new test session
    const insertQuery = `
      INSERT INTO student_tests (student_id, test_id, start_time, status)
      VALUES (?, ?, NOW(), 'started')
    `;

    console.log('Creating new test session with:', { userId, testId });

    db.query(insertQuery, [userId, testId], (err, result) => {
      if (err) {
        console.error('Insert test session error:', err);
        return res.status(500).json({ error: 'Failed to start test session', details: err });
      }

      console.log('Test session created successfully:', result.insertId);

      res.json({
        success: true,
        student_test_id: result.insertId,
        message: 'Test session started successfully'
      });
    });
  });
};

// Save student answer
exports.saveAnswer = (req, res) => {
  const { student_test_id, question_id, answer } = req.body;
  const userId = req.user?.id;

  console.log('Save answer called with:', { student_test_id, question_id, answer, userId });

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  // Verify the test session belongs to this user
  const verifyQuery = `
    SELECT st.student_test_id FROM student_tests st 
    WHERE st.student_test_id = ? AND st.student_id = ? AND (st.status = 'started' OR st.status = 'in_progress')
  `;

  db.query(verifyQuery, [student_test_id, userId], (err, verifyResults) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }

    if (verifyResults.length === 0) {
      return res.status(403).json({ error: 'Invalid test session' });
    }

    // Get correct answer for the question along with option text to allow flexible matching
    const correctAnswerQuery = `SELECT correct_option, option_a, option_b, option_c, option_d FROM questions WHERE question_id = ?`;

    db.query(correctAnswerQuery, [question_id], (err, correctResults) => {
      if (err) return res.status(500).json({ error: 'Database error', details: err });
      if (correctResults.length === 0) {
        console.log('Question not found during answer save:', question_id);
        // treat as incorrect but still save
      }

      // derive normalized stored answer letter
      let storedLetter = '';
      if (correctResults.length > 0) {
        const row = correctResults[0];
        let storedRaw = row.correct_option;
        let stored = storedRaw != null ? String(storedRaw).trim() : '';

        // if already A/B/C/D (case insensitive)
        if (/^[ABCD]$/i.test(stored)) {
          storedLetter = stored.toUpperCase();
        } else if (/^[1-4]$/.test(stored)) {
          // numeric index -> letter
          storedLetter = 'ABCD'[parseInt(stored, 10) - 1];
        } else {
          // try matching the text of the options exactly
          const opts = [row.option_a, row.option_b, row.option_c, row.option_d].map(o => String(o || '').trim());
          const idx = opts.findIndex(o => o === stored);
          if (idx !== -1) storedLetter = 'ABCD'[idx];
        }
      }

      const submitted = answer != null ? String(answer).trim().toUpperCase() : '';
      if (!storedLetter) {
        console.warn('Cannot normalize stored correct option for question', question_id, 'raw:', correctResults[0]?.correct_option);
      }
      const isCorrect = storedLetter && submitted && storedLetter === submitted;
      console.log('Answer check:', { question_id, storedLetter, submitted, isCorrect });

      // Check if an answer already exists for this question in this session
      const checkExistingSql = `SELECT student_answers_id FROM student_answers WHERE student_test_id = ? AND question_id = ?`;

      db.query(checkExistingSql, [student_test_id, question_id], (err, existingResults) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });

        if (existingResults.length > 0) {
          // Update existing
          const updateSql = `UPDATE student_answers SET answer = ?, is_correct = ?, marked_at = NOW() WHERE student_answers_id = ?`;
          db.query(updateSql, [answer, isCorrect ? 1 : 0, existingResults[0].student_answers_id], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update answer' });
            console.log('Answer updated', { student_test_id, question_id, answer, isCorrect });
            res.json({ success: true, message: 'Answer updated', is_correct: isCorrect });
          });
        } else {
          // Insert new
          const insertSql = `INSERT INTO student_answers (student_test_id, question_id, answer, is_correct, marked_at) VALUES (?, ?, ?, ?, NOW())`;
          db.query(insertSql, [student_test_id, question_id, answer, isCorrect ? 1 : 0], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save answer' });
            console.log('Answer saved', { student_test_id, question_id, answer, isCorrect });
            res.json({ success: true, message: 'Answer saved', is_correct: isCorrect });
          });
        }
      });
    });
  });
};

// Submit test and calculate final score
exports.submitTest = (req, res) => {
  const { student_test_id } = req.body;
  const userId = req.user?.id;

  console.log('Submit test called with:', { student_test_id, userId });

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user id in token' });
  }

  if (!student_test_id) {
    return res.status(400).json({ error: 'Student test ID is required' });
  }

  // First, let's check what exists in the database
  const debugQuery = `
    SELECT st.student_test_id, st.student_id, st.test_id, st.status, st.start_time 
    FROM student_tests st 
    WHERE st.student_test_id = ?
  `;

  db.query(debugQuery, [student_test_id], (err, debugResults) => {
    if (err) {
      console.error('Debug query error:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }

    console.log('Debug query results:', debugResults);

    if (debugResults.length === 0) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    const testSession = debugResults[0];
    console.log('Found test session:', testSession);

    // Check if the session belongs to the current user
    if (testSession.student_id !== userId) {
      return res.status(403).json({ error: 'Test session belongs to different user' });
    }

    // Check if status is correct (it might be 'started' or 'in_progress')
    if (testSession.status !== 'started' && testSession.status !== 'in_progress') {
      console.log('Status mismatch. Expected: started or in_progress, Found:', testSession.status);
      // Let's be more lenient and allow any non-completed status
      if (testSession.status === 'completed') {
        return res.status(400).json({ error: 'Test already completed' });
      }
    }

    // Proceed with score calculation
    calculateAndSaveScore(student_test_id, userId, res);
  });
};

function calculateAndSaveScore(student_test_id, userId, res) {
  // First get the test info
  const infoQuery = `
    SELECT st.test_id, st.start_time, t.duration_minutes
    FROM student_tests st
    JOIN tests t ON st.test_id = t.test_id
    WHERE st.student_test_id = ?
  `;

  db.query(infoQuery, [student_test_id], (err, infoResults) => {
    if (err || infoResults.length === 0) {
      console.error('Failed to get test info:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const { test_id, start_time, duration_minutes } = infoResults[0];
    const startTime = new Date(start_time);
    const now = new Date();
    let endTime = now;

    // Safely interpret duration (minutes) if present
    const duration = parseInt(duration_minutes, 10);
    const maxAllowedTimeMs = duration > 0 ? duration * 60 * 1000 : null;
    if (maxAllowedTimeMs !== null && now - startTime > maxAllowedTimeMs) {
      endTime = new Date(startTime.getTime() + maxAllowedTimeMs);
    }

    // Calculate score: Only count correct answers for questions that belong to this test
    const scoreQuery = `
      SELECT 
        (SELECT COUNT(DISTINCT question_id) FROM test_questions WHERE test_id = ?) as total_test_questions,
        COUNT(DISTINCT sa.question_id) as correct_count
      FROM student_answers sa
      INNER JOIN test_questions tq ON sa.question_id = tq.question_id
      WHERE sa.student_test_id = ? AND sa.is_correct = 1 AND tq.test_id = ?
    `;

    db.query(scoreQuery, [test_id, student_test_id, test_id], (err, scoreResults) => {
      if (err) {
        console.error('Score calculation error:', err);
        return res.status(500).json({ error: 'Score calculation error' });
      }

      console.log('Score query results:', scoreResults);

      const correctCount = scoreResults[0]?.correct_count || 0;
      const totalQuestions = scoreResults[0]?.total_test_questions || 1;

      // Calculate percentage score (out of 100)
      const finalScoreValue = Math.min(100, Number(((correctCount / totalQuestions) * 100).toFixed(2)));

      // determine how much time the student actually spent (capped to maxAllowedTimeMs)
      const timeTakenMs = endTime.getTime() - startTime.getTime();
      const timeTakenSeconds = Math.max(0, Math.floor(timeTakenMs / 1000));

      const updateQuery = `
        UPDATE student_tests 
        SET end_time = ?, score = ?, status = 'completed'
        WHERE student_test_id = ?
      `;

      db.query(updateQuery, [endTime, finalScoreValue, student_test_id], (err) => {
        if (err) {
          console.error('Update test error:', err);
          return res.status(500).json({ error: 'Failed to save results' });
        }

        // --- Sync to leaderboard table ---
        if (userId) syncLeaderboard(userId);

        res.json({
          success: true,
          message: 'Test submitted successfully',
          results: {
            total_questions: totalQuestions,
            correct_answers: correctCount,
            score: finalScoreValue,
            time_taken_seconds: timeTakenSeconds
          }
        });
      });
    });
  });
}

// Helper to sync summary stats to the leaderboard table
const syncLeaderboard = (studentId) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_tests,
      SUM(score) as total_score,
      AVG(score) as average_score,
      MAX(score) as highest_score,
      SUM(GREATEST(0, LEAST(t.duration_minutes * 60, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time)))) as total_time_seconds
    FROM student_tests st
    INNER JOIN tests t ON st.test_id = t.test_id
    WHERE st.student_id = ? AND st.status = 'completed'
  `;

  db.query(statsQuery, [studentId], (err, results) => {
    if (err || !results.length) return console.error('Leaderboard sync error:', err);

    const { total_tests, total_score, average_score, highest_score, total_time_seconds } = results[0];

    const upsertSql = `
      INSERT INTO leaderboard (student_id, total_tests, total_score, average_score, highest_score, total_time_seconds, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
      total_tests = VALUES(total_tests),
      total_score = VALUES(total_score),
      average_score = VALUES(average_score),
      highest_score = VALUES(highest_score),
      total_time_seconds = VALUES(total_time_seconds),
      updated_at = NOW()
    `;

    db.query(upsertSql, [studentId, total_tests, total_score, average_score, highest_score, total_time_seconds], (err) => {
      if (err) console.error('Leaderboard upsert error:', err);
      else {
        // Update rank positions for everyone based on average score and time efficiency
        const updateRanksSql = `
          UPDATE leaderboard l
          JOIN (
            SELECT student_id, 
                   ROW_NUMBER() OVER (ORDER BY average_score DESC, (total_time_seconds / total_tests) ASC) as new_rank
            FROM leaderboard
            WHERE total_tests > 0
          ) r ON l.student_id = r.student_id
          SET l.rank_position = r.new_rank
        `;
        db.query(updateRanksSql, (err) => {
          if (err) console.error('Rank update error:', err);
        });
      }
    });
  });
};
