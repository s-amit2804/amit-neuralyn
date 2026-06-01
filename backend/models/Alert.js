const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    // The youth user this alert is for
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The assessment that triggered or prompted this alert
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },

    // How the alert was created:
    // 'auto_high'        → ML classified the session as HIGH intensity automatically
    // 'user_requested'   → User at MEDIUM intensity chose to manually send help request
    type: {
      type: String,
      enum: ['auto_high', 'user_requested'],
      required: true,
    },

    // Severity mirrors intensity from assessment
    severity: {
      type: String,
      enum: ['medium', 'high'],
      required: true,
    },

    // Human-readable description of what triggered the alert
    message: {
      type: String,
      required: true,
    },

    // Alert lifecycle: active → acknowledged → resolved
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
    },

    // NGO staff member who is handling this alert
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Timestamp when the NGO acknowledged/resolved the alert
    acknowledgedAt: Date,
    resolvedAt: Date,

    // Optional notes added by NGO staff when resolving
    resolutionNotes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', alertSchema);
