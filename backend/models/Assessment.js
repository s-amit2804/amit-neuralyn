const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    // The user (youth) this assessment belongs to
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Whether this came from an AI chatbot session or a scheduled mentor meet
    sourceType: {
      type: String,
      enum: ['chat', 'meet', 'direct'],
      default: 'direct',
    },

    // Reference to the originating session for traceability
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sourceModel', // Dynamic reference based on sourceModel
    },
    sourceModel: {
      type: String,
      enum: ['ChatSession', 'Session'],
    },

    // LLM-generated summary passed in from the session
    summary: {
      type: String,
      required: true,
    },

    distressScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    keyPhrases: {
      type: [String],
      default: [],
    },

    triageAction: {
      type: String,
      enum: ['self_help', 'peer_mentor', 'alert_and_escalate'],
      default: 'self_help',
    },

    triageLabel: {
      type: String,
      default: '',
    },

    triageRationale: {
      type: String,
      default: '',
    },

    detectedLanguage: {
      type: String,
      default: 'unknown',
    },

    rawText: {
      type: String,
      default: '',
    },

    normalisedText: {
      type: String,
      default: '',
    },

    transcriptionText: {
      type: String,
      default: '',
    },

    // ML-classified root cause of the user's issue
    issueCategory: {
      type: String,
      enum: [
        'parents',       // Family/parent conflict
        'peers',         // Friend/peer group issues
        'relationship',  // Romantic relationship issues
        'academic',      // School/exam/performance pressure
        'social',        // Social exclusion, bullying
        'self_esteem',   // Low self-worth, identity issues
        'anxiety',       // General anxiety or panic
        'other',
      ],
      required: true,
    },

    // ML-classified severity of the issue
    // Determines the response path the user is shown
    intensityLevel: {
      type: String,
      enum: [
        'low',    // Can self-manage; offered chat or schedule
        'medium', // User chooses: more sessions OR send NGO alert
        'high',   // Auto-escalated to NGO dashboard immediately
      ],
      required: true,
    },

    // Whether an alert was automatically sent to the NGO for this assessment
    alertSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
