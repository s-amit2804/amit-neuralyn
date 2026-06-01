const ChatSession = require('../models/ChatSession');
const { analyzeAndPersistAssessment } = require('../services/assessmentService');
const { generateChatReply } = require('../services/chatbotService');

const buildChatTranscript = (chat) =>
  chat.messages.map((message) => `${message.sender}: ${message.content}`).join('\n');

// ─────────────────────────────────────────────
// @desc    Start a new chatbot session
// @route   POST /api/chat
// @access  Private (users)
// ─────────────────────────────────────────────
exports.startChat = async (req, res) => {
  try {
    // Greet the user with an opening message from the bot
    const openingMessage = {
      sender: 'bot',
      content: `Hey there 👋 I'm here to listen and support you — whatever's on your mind. How are you feeling today?`,
    };

    const chatSession = await ChatSession.create({
      user: req.user._id,
      messages: [openingMessage],
    });

    res.status(201).json({ success: true, data: chatSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Send a message and receive a bot reply
// @route   POST /api/chat/:id/message
// @access  Private (users)
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const chatSession = await ChatSession.findById(req.params.id);
    if (!chatSession) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }

    // Only the session owner can send messages
    if (chatSession.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (chatSession.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This chat session has ended.' });
    }

    // Add user's message to the conversation
    chatSession.messages.push({ sender: 'user', content });

    const botReply = await generateChatReply(chatSession, content);
    chatSession.messages.push({ sender: 'bot', content: botReply });

    await chatSession.save();

    res.json({
      success: true,
      data: {
        userMessage: { sender: 'user', content },
        botReply: { sender: 'bot', content: botReply },
        sessionId: chatSession._id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all chat sessions for the current user
// @route   GET /api/chat
// @access  Private (users)
// ─────────────────────────────────────────────
exports.getAllChats = async (req, res) => {
  try {
    const chats = await ChatSession.find({ user: req.user._id }).sort('-createdAt').select('-messages');
    res.json({ success: true, count: chats.length, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get a specific chat session with full message history
// @route   GET /api/chat/:id
// @access  Private (users)
// ─────────────────────────────────────────────
exports.getChat = async (req, res) => {
  try {
    const chat = await ChatSession.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    res.json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    End the chat, generate analysis, and persist the assessment
// @route   PUT /api/chat/:id/end
// @access  Private (users)
// ─────────────────────────────────────────────
exports.endChat = async (req, res) => {
  try {
    const chat = await ChatSession.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const transcript = buildChatTranscript(chat);
    const analysis = await analyzeAndPersistAssessment({
      userId: req.user._id,
      sourceType: 'chat',
      sourceId: chat._id,
      text: transcript,
    });

    chat.summary = analysis.assessment.summary;
    chat.status = 'completed';
    await chat.save();

    res.json({
      success: true,
      message: 'Chat ended and analysis completed.',
      data: {
        sessionId: chat._id,
        summary: chat.summary,
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
