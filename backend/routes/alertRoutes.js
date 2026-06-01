const express = require('express');
const router = express.Router();
const {
  sendHelpAlert,
  getAllAlerts,
  acknowledgeAlert,
  resolveAlert,
} = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('user'), sendHelpAlert);                         // User requests help (medium)
router.get('/', protect, authorize('ngo', 'admin'), getAllAlerts);                   // NGO sees all alerts
router.put('/:id/acknowledge', protect, authorize('ngo', 'admin'), acknowledgeAlert); // NGO acknowledges
router.put('/:id/resolve', protect, authorize('ngo', 'admin'), resolveAlert);        // NGO resolves

module.exports = router;
