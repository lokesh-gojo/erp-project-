const express = require('express');
const router = express.Router();
const questionController = require('../controllers/QuestionController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});


router.get('/topics', questionController.getTopics);


router.get('/sub-topics', questionController.getSubTopics);

router.get('/sub-topics-with-questions', questionController.getSubTopicsWithQuestions);

router.get('/subtopics/:sub_topic_id/questions', authMiddleware, questionController.getQuestionsBySubTopic);

router.put('/sub-topics-with-questions/:question_id', upload.single('image_file'), questionController.updateQuestion); 
router.put('/update/:question_id', upload.single('image_file'), questionController.updateQuestion); 

router.put('/addquestions', upload.single('image_file'), questionController.addQuestion);


module.exports = router;
