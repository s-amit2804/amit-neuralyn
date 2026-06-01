const express = require('express');
const router = express.Router();
const {
  getAvailableMentors,
  setAvailability,
  getMyAvailability,
  deleteAvailability,
  getEscalatedCases,
  claimEscalatedCase,
} = require('../controllers/mentorController');
const { protect, authorize } = require('../middleware/auth');

// Users browse available mentors on a given date
router.get('/', protect, getAvailableMentors);

// Mentor manages their own schedule
router.post('/availability', protect, authorize('mentor'), setAvailability);
router.get('/availability/me', protect, authorize('mentor'), getMyAvailability);
router.delete('/availability/:id', protect, authorize('mentor'), deleteAvailability);
router.get('/escalated', protect, authorize('mentor'), getEscalatedCases);
router.put('/escalated/:id/claim', protect, authorize('mentor'), claimEscalatedCase);

module.exports = router;
