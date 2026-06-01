const express = require('express');
const router = express.Router();
const {
  bookSession,
  getUserSessions,
  getMentorSessions,
  addMeetLink,
  completeSession,
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('user'), bookSession);            // User books a session
router.get('/', protect, authorize('user'), getUserSessions);         // User views their sessions (dashboard)
router.get('/mentor', protect, authorize('mentor'), getMentorSessions); // Mentor views assigned sessions
router.put('/:id/meetlink', protect, authorize('mentor'), addMeetLink);  // Mentor adds meet link
router.put('/:id/complete', protect, completeSession);                // Either party marks complete

module.exports = router;
