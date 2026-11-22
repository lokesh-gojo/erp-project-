const express = require('express');
const router = express.Router();
const multer = require('multer');
const mlController = require('../controllers/mlController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

router.use(authMiddleware);

// Get student placement AI readiness, company tier, and diagnostic insights
router.get('/placement-intelligence', mlController.getStudentPlacementIntelligence);

// AI Question Generator for faculty & admin
router.post('/generate-questions', mlController.generateQuestions);

// Exam integrity & anomaly check
router.post('/evaluate-integrity', mlController.evaluateIntegrity);

// AI Resume & ATS Placement Scanner
router.post('/scan-resume', upload.single('file'), mlController.scanResume);

// AI Mock Interview Sessions
router.post('/interview/start', mlController.startInterview);
router.post('/interview/evaluate', mlController.evaluateInterviewResponse);

// IEEE Cognitive & Adaptive Intelligence Suite
router.get('/ieee-cognitive-profile', mlController.getIEEECognitiveProfile);
router.post('/classify-bloom', mlController.classifyBloomLevel);
router.post('/cat-next-item', mlController.getCatNextItem);

module.exports = router;

