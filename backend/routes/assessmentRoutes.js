const express = require('express');
const router = express.Router();
const {
  classifySession,
  getMyAssessments,
  getAssessment,
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/classify', protect, authorize('user'), classifySession); // ML classify a session summary
router.post('/analyze', protect, authorize('user'), classifySession);  // Alias for direct text/audio analysis
router.get('/', protect, getMyAssessments);                           // User gets their own assessments
router.get('/:id', protect, getAssessment);                          // Single assessment (user/ngo/admin)

module.exports = router;
