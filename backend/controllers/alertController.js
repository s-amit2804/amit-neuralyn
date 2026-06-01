const Alert = require('../models/Alert');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

const getOrganizationUserIds = async (organizationId) => {
  const users = await User.find({ organization: organizationId }).select('_id');
  return users.map((user) => user._id);
};

// ─────────────────────────────────────────────
// @desc    User manually sends a help alert to the NGO (medium intensity path)
// @route   POST /api/alerts
// @access  Private (users)
// ─────────────────────────────────────────────
exports.sendHelpAlert = async (req, res) => {
  try {
    const { assessmentId } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    // Ensure only the owner of the assessment can send the alert
    if (assessment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Create a user-requested alert for the NGO dashboard
    const alert = await Alert.create({
      user: req.user._id,
      assessment: assessmentId,
      type: 'user_requested', // User chose to request help at medium intensity
      severity: 'medium',
      message: `User has requested help. Issue: ${assessment.issueCategory}. Intensity: ${assessment.intensityLevel}.`,
    });

    // Update the assessment so we know alert was sent
    assessment.alertSent = true;
    await assessment.save();

    res.status(201).json({
      success: true,
      message: 'Your request for help has been sent to the NGO. Someone will reach out soon.',
      data: alert,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all active alerts (for NGO dashboard)
// @route   GET /api/alerts
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.getAllAlerts = async (req, res) => {
  try {
    const { status, severity } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (req.user.role === 'ngo') {
      filter.user = { $in: await getOrganizationUserIds(req.user.organization._id) };
    }

    const alerts = await Alert.find(filter)
      .populate('user', 'name email ageGroup organization language')
      .populate({ path: 'user', populate: { path: 'organization', select: 'name type' } })
      .populate('assessment', 'issueCategory intensityLevel summary')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    NGO staff acknowledges an alert and optionally assigns it
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.acknowledgeAlert = async (req, res) => {
  try {
    const baseFilter =
      req.user.role === 'ngo'
        ? {
            _id: req.params.id,
            user: { $in: await getOrganizationUserIds(req.user.organization._id) },
          }
        : { _id: req.params.id };

    const alert = await Alert.findOneAndUpdate(
      baseFilter,
      {
        status: 'acknowledged',
        assignedTo: req.user._id, // Assign to the NGO staff member who acknowledged
        acknowledgedAt: new Date(),
      },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    NGO staff resolves an alert with resolution notes
// @route   PUT /api/alerts/:id/resolve
// @access  Private (ngo, admin)
// ─────────────────────────────────────────────
exports.resolveAlert = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const baseFilter =
      req.user.role === 'ngo'
        ? {
            _id: req.params.id,
            user: { $in: await getOrganizationUserIds(req.user.organization._id) },
          }
        : { _id: req.params.id };

    const alert = await Alert.findOneAndUpdate(
      baseFilter,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || '',
      },
      { returnDocument: 'after' }
    );

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
