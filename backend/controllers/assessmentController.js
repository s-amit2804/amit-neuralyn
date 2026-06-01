const Assessment = require('../models/Assessment');
const ChatSession = require('../models/ChatSession');
const Session = require('../models/Session');
const User = require('../models/User');
const { analyzeAndPersistAssessment } = require('../services/assessmentService');
const { withTemporaryAudioFile } = require('../services/mlPipelineService');

const buildChatTranscript = (chat) =>
  chat.messages.map((message) => `${message.sender}: ${message.content}`).join('\n');

const getSourceContent = async ({ sourceType, sourceId, summary, userId }) => {
  if (summary) {
    return { text: summary, sourceDocument: null };
  }

  if (!sourceType || !sourceId) {
    return { text: null, sourceDocument: null };
  }

  if (sourceType === 'chat') {
    const chat = await ChatSession.findById(sourceId);
    if (!chat) {
      throw new Error('Chat session not found.');
    }
    if (chat.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to analyze this chat session.');
    }
    return {
      text: buildChatTranscript(chat),
      sourceDocument: chat,
    };
  }

  if (sourceType === 'meet') {
    const session = await Session.findById(sourceId);
    if (!session) {
      throw new Error('Session not found.');
    }
    if (session.user.toString() !== userId.toString()) {
      throw new Error('Not authorized to analyze this session.');
    }
    return {
      text: session.summary || null,
      sourceDocument: session,
    };
  }

  return { text: null, sourceDocument: null };
};

exports.classifySession = async (req, res) => {
  try {
    const { sourceType = 'direct', sourceId, summary, text, audioBase64, audioFileName } = req.body;

    const sourceData = await getSourceContent({
      sourceType,
      sourceId,
      summary,
      userId: req.user._id,
    });
    const finalText = text || sourceData.text;

    if (!finalText && !audioBase64) {
      return res.status(400).json({
        success: false,
        message: 'Provide text/summary, a valid source reference, or audioBase64.',
      });
    }

    const result = await withTemporaryAudioFile(
      { audioBase64, fileName: audioFileName },
      async (tempAudioPath) =>
        analyzeAndPersistAssessment({
          userId: req.user._id,
          sourceType,
          sourceId: sourceId || null,
          text: finalText,
          audioPath: tempAudioPath,
        })
    );

    res.status(201).json({
      success: true,
      data: {
        assessmentId: result.assessment._id,
        issueCategory: result.assessment.issueCategory,
        intensityLevel: result.assessment.intensityLevel,
        distressScore: result.assessment.distressScore,
        keyPhrases: result.assessment.keyPhrases,
        nextStep: result.nextStep,
        legacyNextStep: result.legacyNextStep,
        triage: {
          action: result.assessment.triageAction,
          label: result.assessment.triageLabel,
          rationale: result.assessment.triageRationale,
        },
        summary: result.assessment.summary,
        detectedLanguage: result.assessment.detectedLanguage,
        alertCreated: Boolean(result.alert),
      },
    });
  } catch (error) {
    const statusCode = /not found/i.test(error.message) ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

exports.getMyAssessments = async (req, res) => {
  try {
    let filter = { user: req.user._id };

    if (req.user.role === 'admin') {
      filter = {};
    } else if (req.user.role === 'ngo') {
      const users = await User.find({ organization: req.user.organization._id }).select('_id');
      filter = { user: { $in: users.map((user) => user._id) } };
    }

    const assessments = await Assessment.find(filter).sort('-createdAt');
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    const isOwner = assessment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    let isNgoInSameOrg = false;

    if (req.user.role === 'ngo') {
      const owner = await User.findById(assessment.user).select('organization');
      isNgoInSameOrg =
        owner &&
        owner.organization &&
        owner.organization.toString() === req.user.organization._id.toString();
    }

    if (!isOwner && !isAdmin && !isNgoInSameOrg) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
