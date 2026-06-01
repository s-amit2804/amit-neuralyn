const Assessment = require('../models/Assessment');
const Alert = require('../models/Alert');
const ChatSession = require('../models/ChatSession');
const Session = require('../models/Session');
const User = require('../models/User');

const getScopedUserIds = async (req) => {
  if (req.user.role !== 'ngo') {
    return null;
  }

  const users = await User.find({ organization: req.user.organization._id }).select('_id');
  return users.map((user) => user._id);
};

// ─────────────────────────────────────────────
// @desc    Top-level platform stats for NGO dashboard
//          Returns: total users, chats, sessions, active alerts, resolved alerts
// @route   GET /api/dashboard/stats
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getOverallStats = async (req, res) => {
  try {
    const scopedUserIds = await getScopedUserIds(req);
    const userFilter =
      req.user.role === 'ngo'
        ? { role: 'user', organization: req.user.organization._id }
        : { role: 'user' };
    const interactionFilter = scopedUserIds ? { user: { $in: scopedUserIds } } : {};
    const alertFilter = scopedUserIds ? { user: { $in: scopedUserIds } } : {};

    const [totalUsers, totalChats, totalSessions, activeAlerts, resolvedAlerts] = await Promise.all([
      User.countDocuments(userFilter),
      ChatSession.countDocuments({ ...interactionFilter, status: 'completed' }),
      Session.countDocuments({ ...interactionFilter, status: 'completed' }),
      Alert.countDocuments({ ...alertFilter, status: { $in: ['active', 'acknowledged'] } }),
      Alert.countDocuments({ ...alertFilter, status: 'resolved' }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalChats,
        totalSessions,
        totalInteractions: totalChats + totalSessions,
        activeAlerts,
        resolvedAlerts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Issues breakdown by age group (for area/bar chart on NGO dashboard)
//          Aggregates assessments → joins user's ageGroup → groups by category
// @route   GET /api/dashboard/issues-by-age
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getIssuesByAgeGroup = async (req, res) => {
  try {
    const scopedUserIds = await getScopedUserIds(req);
    const data = await Assessment.aggregate([
      // Step 1: Join user info to get their ageGroup
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      ...(scopedUserIds ? [{ $match: { user: { $in: scopedUserIds } } }] : []),

      // Step 2: Group by ageGroup + issueCategory to count occurrences
      {
        $group: {
          _id: {
            ageGroup: '$userInfo.ageGroup',
            issueCategory: '$issueCategory',
          },
          count: { $sum: 1 },
        },
      },

      // Step 3: Reshape for easier charting on the frontend
      {
        $group: {
          _id: '$_id.ageGroup',
          issues: {
            $push: {
              category: '$_id.issueCategory',
              count: '$count',
            },
          },
          total: { $sum: '$count' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Issues breakdown by organization (for bar chart comparing orgs)
// @route   GET /api/dashboard/issues-by-org
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getIssuesByOrganization = async (req, res) => {
  try {
    const scopedUserIds = await getScopedUserIds(req);
    const data = await Assessment.aggregate([
      // Join user to get their organization
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      ...(scopedUserIds ? [{ $match: { user: { $in: scopedUserIds } } }] : []),

      // Join organization to get its name
      {
        $lookup: {
          from: 'organizations',
          localField: 'userInfo.organization',
          foreignField: '_id',
          as: 'orgInfo',
        },
      },
      { $unwind: { path: '$orgInfo', preserveNullAndEmptyArrays: true } },

      // Group by org name + issue category
      {
        $group: {
          _id: {
            orgName: '$orgInfo.name',
            orgType: '$orgInfo.type',
            issueCategory: '$issueCategory',
          },
          count: { $sum: 1 },
        },
      },

      // Reshape into org-level buckets
      {
        $group: {
          _id: { orgName: '$_id.orgName', orgType: '$_id.orgType' },
          issues: {
            $push: {
              category: '$_id.issueCategory',
              count: '$count',
            },
          },
          total: { $sum: '$count' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Distribution of intensity levels (low/medium/high) — for a pie/donut chart
// @route   GET /api/dashboard/intensity-distribution
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getIntensityDistribution = async (req, res) => {
  try {
    const scopedUserIds = await getScopedUserIds(req);
    const data = await Assessment.aggregate([
      ...(scopedUserIds ? [{ $match: { user: { $in: scopedUserIds } } }] : []),
      {
        $group: {
          _id: '$intensityLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    // Normalise to { low: N, medium: N, high: N } for easy chart consumption
    const result = { low: 0, medium: 0, high: 0 };
    data.forEach((d) => {
      result[d._id] = d.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Alerts created over time (for a line/trend chart)
//          Groups alerts by day over the last 30 days
// @route   GET /api/dashboard/alerts-trend
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getAlertsTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const scopedUserIds = await getScopedUserIds(req);

    const data = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          ...(scopedUserIds ? { user: { $in: scopedUserIds } } : {}),
        },
      },
      {
        $group: {
          _id: {
            // Group by calendar date (year-month-day)
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            severity: '$severity',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Chat vs session counts per month (for activity trend chart)
// @route   GET /api/dashboard/activity-trend
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getActivityTrend = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const scopedUserIds = await getScopedUserIds(req);

    const [chatData, sessionData] = await Promise.all([
      ChatSession.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            status: 'completed',
            ...(scopedUserIds ? { user: { $in: scopedUserIds } } : {}),
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Session.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            status: 'completed',
            ...(scopedUserIds ? { user: { $in: scopedUserIds } } : {}),
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        chats: chatData,   // [ { _id: '2025-01', count: 12 }, ... ]
        sessions: sessionData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
