const Session = require('../models/Session');
const MentorAvailability = require('../models/MentorAvailability');
const nodemailer = require('nodemailer');
const { analyzeAndPersistAssessment } = require('../services/assessmentService');
const { withTemporaryAudioFile } = require('../services/mlPipelineService');

// ── Email helper: notify mentor of a new booking ──────────────────────────────
// In production, replace with a proper email service (SendGrid, AWS SES, etc.)
const sendMentorNotification = async (mentorEmail, mentorName, userName, date, startTime) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `MindBridge <${process.env.EMAIL_USER}>`,
      to: mentorEmail,
      subject: '📅 New Session Booked - MindBridge',
      html: `
        <h2>Hi ${mentorName},</h2>
        <p>A new session has been scheduled with you on MindBridge.</p>
        <p><strong>User:</strong> ${userName}</p>
        <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
        <p><strong>Time:</strong> ${startTime}</p>
        <p>Please log in to your dashboard to confirm and share your meet link.</p>
        <br/>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mentor/dashboard">Go to Dashboard →</a>
      `,
    });
    return true;
  } catch (err) {
    // Log failure but don't block the booking — email is non-critical
    console.warn('Email notification failed (non-critical):', err.message);
    return false;
  }
};

// ─────────────────────────────────────────────
// @desc    User books a session with a mentor
// @route   POST /api/sessions
// @access  Private (users)
// ─────────────────────────────────────────────
exports.bookSession = async (req, res) => {
  try {
    const { availabilityId, slotIndex, languagePreference, genderPreference } = req.body;

    // Fetch the mentor's availability document to validate the slot
    const availability = await MentorAvailability.findById(availabilityId).populate(
      'mentor',
      'name email'
    );

    if (!availability) {
      return res.status(404).json({ success: false, message: 'Availability not found.' });
    }

    const slot = availability.slots[slotIndex];
    if (!slot) {
      return res.status(400).json({ success: false, message: 'Invalid slot index.' });
    }

    // Prevent double-booking the same slot
    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked. Please choose another.',
      });
    }

    // Mark the slot as booked in the availability document
    availability.slots[slotIndex].isBooked = true;
    await availability.save();

    // Create the session record
    const session = await Session.create({
      user: req.user._id,
      mentor: availability.mentor._id,
      availability: availabilityId,
      slotIndex,
      scheduledDate: availability.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'confirmed',
      languagePreference: languagePreference || 'en',
      genderPreference: genderPreference || 'no_preference',
    });

    // Notify the mentor via email and flag whether notification was sent
    const emailSent = await sendMentorNotification(
      availability.mentor.email,
      availability.mentor.name,
      req.user.name,
      availability.date,
      slot.startTime
    );

    session.notificationSentToMentor = emailSent;
    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('user', 'name email')
      .populate('mentor', 'name email gender language');

    res.status(201).json({ success: true, data: populatedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all of the current user's booked sessions (shown on dashboard)
// @route   GET /api/sessions
// @access  Private (users)
// ─────────────────────────────────────────────
exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .populate('mentor', 'name email gender language')
      .sort('-scheduledDate');

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all sessions assigned to the current mentor
// @route   GET /api/sessions/mentor
// @access  Private (mentors)
// ─────────────────────────────────────────────
exports.getMentorSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ mentor: req.user._id })
      .populate('user', 'name email ageGroup organization')
      .sort('-scheduledDate');

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Mentor provides the Google Meet / Zoom link for a session
//          This link is then shown on the user's dashboard
// @route   PUT /api/sessions/:id/meetlink
// @access  Private (mentors)
// ─────────────────────────────────────────────
exports.addMeetLink = async (req, res) => {
  try {
    const { meetLink } = req.body;

    if (!meetLink) {
      return res.status(400).json({ success: false, message: 'Please provide a meet link.' });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      mentor: req.user._id, // Ensure only the assigned mentor can add the link
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.meetLink = meetLink;
    await session.save();

    res.json({
      success: true,
      message: 'Meet link added. User will see this on their dashboard.',
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Mark a session as completed and generate analysis in the backend
// @route   PUT /api/sessions/:id/complete
// @access  Private (mentors or the user themselves)
// ─────────────────────────────────────────────
exports.completeSession = async (req, res) => {
  try {
    const { summary, notes, audioBase64, audioFileName } = req.body;

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Only the mentor or the user in the session can mark it complete
    const isMentor = session.mentor.toString() === req.user._id.toString();
    const isUser = session.user.toString() === req.user._id.toString();
    if (!isMentor && !isUser) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    session.status = 'completed';
    const inputText = summary || notes || session.summary || '';

    if (!inputText && !audioBase64) {
      return res.status(400).json({
        success: false,
        message: 'Provide a session summary/notes or audioBase64 to complete and analyze the session.',
      });
    }

    const analysis = await withTemporaryAudioFile(
      { audioBase64, fileName: audioFileName },
      async (tempAudioPath) =>
        analyzeAndPersistAssessment({
          userId: session.user,
          sourceType: 'meet',
          sourceId: session._id,
          text: inputText || null,
          audioPath: tempAudioPath,
        })
    );

    session.summary = analysis.assessment.summary;
    await session.save();

    res.json({
      success: true,
      message: 'Session marked complete and analyzed.',
      data: {
        session,
        assessmentId: analysis.assessment._id,
        issueCategory: analysis.assessment.issueCategory,
        intensityLevel: analysis.assessment.intensityLevel,
        distressScore: analysis.assessment.distressScore,
        nextStep: analysis.nextStep,
        legacyNextStep: analysis.legacyNextStep,
        triage: {
          action: analysis.assessment.triageAction,
          label: analysis.assessment.triageLabel,
          rationale: analysis.assessment.triageRationale,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
