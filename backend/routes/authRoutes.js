const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  getOrganizations,
  createOrganization,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/organizations', getOrganizations);                          // Public: for registration dropdown
router.post('/organizations', createOrganization); // Making it public for initial testing and seeding.

module.exports = router;
