const db = require('../config/conn');
const http = require('http');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5002';

// Helper to make JSON HTTP calls to python FastAPI ML service
function callMLService(endpoint, body, method = 'POST') {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(endpoint, ML_SERVICE_URL);
      const data = body ? JSON.stringify(body) : null;

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
          },
          timeout: 4000
        },
        res => {
          let buf = '';
          res.on('data', d => (buf += d));
          res.on('end', () => {
            try {
              resolve(JSON.parse(buf));
            } catch (e) {
              resolve({ success: false, raw: buf });
            }
          });
        }
      );

      req.on('error', err => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('ML service timeout'));
      });

      if (data) req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// 1. Get comprehensive placement AI intelligence for the authenticated student
exports.getStudentPlacementIntelligence = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch student's test history for placement tests
    const testHistorySql = `
      SELECT t.test_id, t.title, t.subject, t.num_questions,
             tp.title as topic_title,
             st.student_test_id, st.status, st.score, st.start_time, st.end_time,
             TIMESTAMPDIFF(SECOND, st.start_time, st.end_time) as duration_sec
      FROM tests t
      LEFT JOIN topics tp ON t.topic_id = tp.topic_id
      LEFT JOIN student_tests st ON t.test_id = st.test_id AND st.student_id = ?
      WHERE t.type = 'placement'
      ORDER BY t.test_id ASC
    `;

    const [testResults] = await db.promise().query(testHistorySql, [userId]);

    // Map module scores
    let quantScore = 0;
    let reasoningScore = 0;
    let verbalScore = 0;
    let techScore = 0;
    let completedCount = 0;
    let totalSec = 0;
    let totalQuestionsCount = 0;

    const completedTests = [];

    testResults.forEach(r => {
      const subject = (r.subject || r.topic_title || '').toLowerCase();
      const score = Number(r.score) || 0;
      const numQ = Number(r.num_questions) || 25;

      if (r.status === 'completed') {
        completedCount++;
        completedTests.push({
          test_id: r.test_id,
          title: r.title,
          score: score,
          duration_sec: r.duration_sec || 0
        });

        totalSec += r.duration_sec || 600;
        totalQuestionsCount += numQ;

        if (subject.includes('quant') || subject.includes('aptitude')) quantScore = score;
        else if (subject.includes('reason') || subject.includes('logic')) reasoningScore = score;
        else if (subject.includes('verb') || subject.includes('english')) verbalScore = score;
        else if (subject.includes('tech') || subject.includes('code') || subject.includes('cs')) techScore = score;
      }
    });

    const avgTimePerQ = totalQuestionsCount > 0 ? totalSec / totalQuestionsCount : 60.0;

    // Fetch student answer errors for diagnostic recommender
    const answersSql = `
      SELECT sa.question_id, sa.is_correct, q.mark,
             st.title as sub_topic_title, tp.title as topic_title
      FROM student_answers sa
      JOIN student_tests stest ON sa.student_test_id = stest.student_test_id
      JOIN questions q ON sa.question_id = q.question_id
      LEFT JOIN sub_topics st ON q.sub_topic_id = st.sub_topic_id
      LEFT JOIN topics tp ON st.topic_id = tp.topic_id
      WHERE stest.student_id = ?
      ORDER BY sa.student_answers_id DESC
      LIMIT 100
    `;

    const [answersResults] = await db.promise().query(answersSql, [userId]);

    // Call ML Microservice endpoints in parallel
    let placementPrediction = null;
    let weakAreaDiagnosis = null;
    let performanceForecast = null;

    try {
      const [predRes, weakRes, forecastRes] = await Promise.all([
        callMLService('/predict/placement-fit', {
          quant_score: quantScore,
          reasoning_score: reasoningScore,
          verbal_score: verbalScore,
          tech_score: techScore,
          avg_time_sec_per_q: avgTimePerQ,
          tests_completed: completedCount
        }),
        callMLService('/recommend/weak-areas', {
          answers: answersResults
        }),
        callMLService('/forecast/performance', {
          test_history: completedTests
        })
      ]);

      if (predRes.success) placementPrediction = predRes.data;
      if (weakRes.success) weakAreaDiagnosis = weakRes.data;
      if (forecastRes.success) performanceForecast = forecastRes.data;
    } catch (mlErr) {
      console.warn('⚠️ ML service offline, using heuristic fallback:', mlErr.message);
      // Fallback heuristics
      const overall = (quantScore * 0.3 + reasoningScore * 0.25 + verbalScore * 0.2 + techScore * 0.25);
      placementPrediction = {
        placement_probability: Math.round(Math.max(25, overall)),
        predicted_tier: overall >= 75 ? 3 : (overall >= 60 ? 2 : (overall >= 45 ? 1 : 0)),
        tier_details: {
          tier_name: overall >= 75 ? "Tier 1: Dream & Product Companies" : (overall >= 60 ? "Tier 2: Specialist Track" : "Tier 3: Mass Recruiters"),
          badge: overall >= 75 ? "Product Ready" : "Specialist Track",
          badge_color: overall >= 75 ? "emerald" : "blue",
          target_companies: overall >= 75 ? ["Zoho", "Amazon", "Microsoft"] : ["TCS", "Infosys", "Cognizant"],
          ctc_range: overall >= 75 ? "8.0 - 24.0 LPA" : "4.0 - 8.0 LPA"
        },
        recommendations: ["Complete all 4 modules to obtain higher confidence predictions."]
      };
      weakAreaDiagnosis = { has_data: false, weak_areas: [] };
      performanceForecast = { has_data: false, momentum_badge: "Baseline" };
    }

    res.json({
      success: true,
      data: {
        completed_modules_count: completedCount,
        scores: {
          quant: quantScore,
          reasoning: reasoningScore,
          verbal: verbalScore,
          tech: techScore
        },
        placement_prediction: placementPrediction,
        weak_area_diagnosis: weakAreaDiagnosis,
        performance_forecast: performanceForecast
      }
    });
  } catch (err) {
    console.error('Error generating placement intelligence:', err);
    res.status(500).json({ error: 'Database or ML error', details: err.message });
  }
};

// 2. AI Question Generator for Faculty & Admin
exports.generateQuestions = async (req, res) => {
  const { domain, count, test_id } = req.body;
  const numQuestions = Math.min(30, Math.max(1, parseInt(count, 10) || 5));

  try {
    const mlRes = await callMLService('/generate/questions', {
      domain: domain || 'quant',
      count: numQuestions
    });

    if (!mlRes.success || !mlRes.questions) {
      return res.status(500).json({ error: 'Failed to generate questions from AI model' });
    }

    const generated = mlRes.questions;

    // If test_id provided, automatically insert questions into test
    if (test_id) {
      const [testInfo] = await db.promise().query('SELECT sub_topic_id FROM tests WHERE test_id = ?', [test_id]);
      const subTopicId = testInfo[0]?.sub_topic_id || null;

      for (const q of generated) {
        const [ins] = await db.promise().query(
          `INSERT INTO questions 
           (sub_topic_id, created_by, by_admin, question_text, option_a, option_b, option_c, option_d, correct_option, mark)
           VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, 1)
           RETURNING question_id`,
          [subTopicId, req.user?.id || 1, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
        );
        const qId = ins[0]?.question_id || ins.insertId;
        if (qId) {
          await db.promise().query(
            'INSERT INTO test_questions (test_id, question_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
            [test_id, qId]
          );
        }
      }

      await db.promise().query(
        'UPDATE tests SET num_questions = (SELECT COUNT(*) FROM test_questions WHERE test_id = ?) WHERE test_id = ?',
        [test_id, test_id]
      );
    }

    res.json({
      success: true,
      message: `Generated ${generated.length} AI questions successfully`,
      questions: generated
    });
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: 'Question generation error', details: err.message });
  }
};

// 3. Exam Integrity & Malpractice Anomaly Check
exports.evaluateIntegrity = async (req, res) => {
  const { total_questions, duration_seconds, score_pct, answers } = req.body;

  try {
    const result = await callMLService('/detect/exam-integrity', {
      total_questions: total_questions || 25,
      duration_seconds: duration_seconds || 600,
      score_pct: score_pct || 0,
      answers: answers || []
    });

    res.json({ success: true, data: result.data || result });
  } catch (err) {
    console.error('Error evaluating exam integrity:', err);
    res.status(500).json({ error: 'Integrity check error', details: err.message });
  }
};

// 4. Resume & ATS Placement Readiness Scanner
exports.scanResume = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let fileName = req.body.file_name || (req.file ? req.file.originalname : 'Candidate_Resume.pdf');
    let fileBase64 = null;
    let textContent = req.body.text_content || null;

    if (req.file) {
      fileBase64 = req.file.buffer.toString('base64');
    } else if (req.body.file_base64) {
      fileBase64 = req.body.file_base64;
    } else if (!textContent) {
      return res.status(400).json({ error: 'Please upload a resume document or provide resume text.' });
    }

    const result = await callMLService('/placement/scan-resume', {
      file_name: fileName,
      file_base64: fileBase64,
      text_content: textContent,
      target_role: req.body.target_role || 'Software Engineer'
    });

    res.json(result);
  } catch (err) {
    console.error('Error scanning resume:', err);
    res.status(500).json({ error: 'Resume analysis failed', details: err.message });
  }
};

// 5. Start AI Technical / HR Mock Interview
exports.startInterview = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { domain = 'tech_cs', role_title = 'Software Engineer' } = req.body;

  try {
    const result = await callMLService('/interview/start', {
      domain,
      role_title
    });

    res.json(result);
  } catch (err) {
    console.error('Error starting interview session:', err);
    res.status(500).json({ error: 'Failed to initiate interview', details: err.message });
  }
};

// 6. Evaluate Student Response in Mock Interview
exports.evaluateInterviewResponse = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { domain, question_id, student_answer, question_index } = req.body;

  try {
    const result = await callMLService('/interview/evaluate-response', {
      domain: domain || 'tech_cs',
      question_id: String(question_id || '1'),
      student_answer: student_answer || '',
      question_index: parseInt(question_index, 10) || 1
    });

    res.json(result);
  } catch (err) {
    console.error('Error evaluating interview answer:', err);
    res.status(500).json({ error: 'Interview response evaluation failed', details: err.message });
  }
};

