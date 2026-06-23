
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/leaderboard
router.get('/', leaderboardController.getLeaderboard);

// GET /api/leaderboard/faculty (faculty department leaderboard)
router.get('/faculty', authMiddleware, leaderboardController.getFacultyLeaderboard);

// GET /api/leaderboard/tests (get available tests for leaderboard)
router.get('/tests', authMiddleware, leaderboardController.getLeaderboardTests);

// GET /api/leaderboard/student-rank
router.get('/student-rank', authMiddleware, leaderboardController.getStudentRank);

module.exports = router;
