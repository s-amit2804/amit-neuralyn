const mongoose = require('mongoose');

// Each individual message in a chatbot conversation
const messageSchema = new mongoose.Schema({
  // 'user' = the youth, 'bot' = AI chatbot response
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    // The user (youth) who started this chat
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Full conversation transcript
    messages: [messageSchema],

    // LLM-generated summary of the conversation — used as input
    // to the ML classification model to determine issue type + intensity
    summary: {
      type: String,
      default: '',
    },

    // active = chat ongoing, completed = user ended the chat
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
