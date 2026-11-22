const http = require('http');
const db = require('../config/conn');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5002';

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
          timeout: 60000
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

// 1. Upload Syllabus or Question Paper
exports.uploadDocument = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionId = `student_${userId}`;
  const docType = req.body.doc_type || 'syllabus'; // 'syllabus' or 'question_paper'

  try {
    let fileName = req.body.file_name || (req.file ? req.file.originalname : 'Uploaded_Document.txt');
    let fileBase64 = null;
    let textContent = req.body.text_content || null;

    if (req.file) {
      fileBase64 = req.file.buffer.toString('base64');
    } else if (req.body.file_base64) {
      fileBase64 = req.body.file_base64;
    } else if (!textContent) {
      return res.status(400).json({ error: 'Please provide a file or text content to upload.' });
    }

    const mlRes = await callMLService('/rag/upload', {
      session_id: sessionId,
      file_name: fileName,
      doc_type: docType,
      file_base64: fileBase64,
      text_content: textContent
    });

    res.json(mlRes);
  } catch (err) {
    console.error('Error uploading RAG document:', err);
    res.status(500).json({ error: 'Document ingestion failed', details: err.message });
  }
};

// 2. Get currently indexed documents for the student
exports.getDocuments = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionId = `student_${userId}`;
  try {
    const mlRes = await callMLService(`/rag/session/${sessionId}`, null, 'GET');
    res.json({ success: true, data: mlRes });
  } catch (err) {
    console.error('Error getting RAG documents:', err);
    res.status(500).json({ error: 'Failed to retrieve documents', details: err.message });
  }
};

// 3. Clear session documents
exports.clearDocuments = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionId = `student_${userId}`;
  try {
    const mlRes = await callMLService(`/rag/session/${sessionId}`, null, 'DELETE');
    res.json(mlRes);
  } catch (err) {
    console.error('Error clearing RAG documents:', err);
    res.status(500).json({ error: 'Failed to clear documents', details: err.message });
  }
};

// 4. Chat / Clear Doubts based on uploaded Syllabus & Question Paper
exports.chatDoubt = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const sessionId = `student_${userId}`;
  try {
    const mlRes = await callMLService('/rag/chat', {
      session_id: sessionId,
      query: query.trim()
    });

    res.json(mlRes);
  } catch (err) {
    console.error('Error during RAG doubt clearing chat:', err);
    res.status(500).json({ error: 'Doubt clearing failed', details: err.message });
  }
};

// 5. Generate Quiz from uploaded documents
exports.generateQuiz = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { num_questions = 5, focus = 'hybrid', difficulty = 'medium', save_to_tests = false, title } = req.body;
  const sessionId = `student_${userId}`;

  try {
    const mlRes = await callMLService('/rag/generate-quiz', {
      session_id: sessionId,
      num_questions: Math.min(20, Math.max(3, parseInt(num_questions, 10) || 5)),
      focus: focus || 'hybrid',
      difficulty: difficulty || 'medium'
    });

    if (!mlRes.success || !mlRes.questions || mlRes.questions.length === 0) {
      return res.status(400).json({
        error: mlRes.error || 'Could not generate quiz. Please ensure you have uploaded documents with sufficient content.'
      });
    }

    // Optional: save to student's test list so they can take it in formal test mode
    let createdTestId = null;
    if (save_to_tests) {
      const testTitle = title || `RAG Practice Quiz - ${new Date().toLocaleDateString()}`;
      const [testInsert] = await db.promise().query(
        `INSERT INTO tests 
         (title, description, subject, added_by, num_questions, duration_minutes, is_active, total_marks, type)
         VALUES (?, ?, 'AI RAG Custom Quiz', ?, ?, 15, 1, ?, 'regular')
         RETURNING test_id`,
        [testTitle, 'Auto-generated quiz grounded in uploaded syllabus and question paper.', userId, mlRes.questions.length, mlRes.questions.length]
      );
      createdTestId = testInsert[0]?.test_id || testInsert.insertId;

      if (createdTestId) {
        for (const q of mlRes.questions) {
          const [qInsert] = await db.promise().query(
            `INSERT INTO questions 
             (created_by, by_admin, question_text, option_a, option_b, option_c, option_d, correct_option, mark)
             VALUES (?, 0, ?, ?, ?, ?, ?, ?, 1)
             RETURNING question_id`,
            [userId, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
          );
          const qId = qInsert[0]?.question_id || qInsert.insertId;
          if (qId) {
            await db.promise().query(
              'INSERT INTO test_questions (test_id, question_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
              [createdTestId, qId]
            );
          }
        }
      }
    }

    res.json({
      success: true,
      questions: mlRes.questions,
      count: mlRes.questions.length,
      test_id: createdTestId,
      generated_by: mlRes.generated_by
    });
  } catch (err) {
    console.error('Error generating RAG quiz:', err);
    res.status(500).json({ error: 'Quiz generation failed', details: err.message });
  }
};

// 6. Generate interactive Flashcards from active study material
exports.getFlashcards = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { count = 8 } = req.body;
  const sessionId = `student_${userId}`;

  try {
    const mlRes = await callMLService('/rag/generate-flashcards', {
      session_id: sessionId,
      count: Math.min(20, Math.max(4, parseInt(count, 10) || 8))
    });

    res.json(mlRes);
  } catch (err) {
    console.error('Error generating flashcards:', err);
    res.status(500).json({ error: 'Failed to generate flashcards', details: err.message });
  }
};

// 7. Synthesize Quick-Revision Markdown Cheat Sheet
exports.getCheatSheet = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionId = `student_${userId}`;

  try {
    const mlRes = await callMLService('/rag/generate-cheat-sheet', {
      session_id: sessionId
    });

    res.json(mlRes);
  } catch (err) {
    console.error('Error generating cheat sheet:', err);
    res.status(500).json({ error: 'Failed to generate cheat sheet', details: err.message });
  }
};

// 8. Get RAG AI Agent Capabilities & Active Tools
exports.getAgentCapabilities = async (req, res) => {
  try {
    const mlRes = await callMLService('/rag/agent/capabilities', null, 'GET');
    res.json({ success: true, data: mlRes });
  } catch (err) {
    console.error('Error getting agent capabilities:', err);
    res.status(500).json({ error: 'Failed to retrieve agent capabilities', details: err.message });
  }
};

// 9. Multi-Step ReAct Interaction with Autonomous RAG AI Agent
exports.interactAgent = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, persona = 'strategy', days_left = 5 } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Prompt message is required.' });
  }

  const sessionId = `student_${userId}`;

  try {
    const mlRes = await callMLService('/rag/agent/interact', {
      session_id: sessionId,
      message: message.trim(),
      persona,
      days_left: parseInt(days_left, 10) || 5
    });

    res.json(mlRes);
  } catch (err) {
    console.error('Error in RAG Agent interaction:', err);
    res.status(500).json({ error: 'Agent interaction failed', details: err.message });
  }
};
