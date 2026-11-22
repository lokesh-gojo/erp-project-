const express = require('express');
const router = express.Router();
const multer = require('multer');
const ragController = require('../controllers/ragController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure memory storage for PDF & text uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

router.use(authMiddleware);

// Upload document (Syllabus or Question Paper)
router.post('/upload', upload.single('file'), ragController.uploadDocument);

// Get current session documents
router.get('/documents', ragController.getDocuments);

// Clear current session documents
router.delete('/documents', ragController.clearDocuments);

// Doubt Clearing Chatbot
router.post('/chat', ragController.chatDoubt);

// RAG Quiz Generator
router.post('/generate-quiz', ragController.generateQuiz);

// AI Flashcards Generator
router.post('/flashcards', ragController.getFlashcards);

// AI Smart Cheat Sheet Generator
router.post('/cheat-sheet', ragController.getCheatSheet);

// Autonomous RAG AI Agent
router.get('/agent/capabilities', ragController.getAgentCapabilities);
router.post('/agent/interact', ragController.interactAgent);

module.exports = router;

