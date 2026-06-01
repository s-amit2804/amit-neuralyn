const express = require('express');
const router = express.Router();
const {
  getOverallStats,
  getIssuesByAgeGroup,
  getIssuesByOrganization,
  getIntensityDistribution,
  getAlertsTrend,
  getActivityTrend,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// All dashboard routes are NGO/admin only
router.use(protect, authorize('ngo', 'admin'));

router.get('/stats', getOverallStats);                       // Total users, chats, sessions, alerts
router.get('/issues-by-age', getIssuesByAgeGroup);           // Issue categories per age group
router.get('/issues-by-org', getIssuesByOrganization);       // Issue categories per organization
router.get('/intensity-distribution', getIntensityDistribution); // low/medium/high pie chart data
router.get('/alerts-trend', getAlertsTrend);                 // Alert counts over last 30 days
router.get('/activity-trend', getActivityTrend);             // Chat vs session counts per month

module.exports = router;
