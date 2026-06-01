const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    // The user (youth) who booked this session
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The mentor assigned to this session
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The specific availability document this session was booked from
    availability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MentorAvailability',
      required: true,
    },

    // The exact slot index within the availability document
    slotIndex: {
      type: Number,
      required: true,
    },

    // Scheduled date and start/end time of the session
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: String,
    endTime: String,

    // Status lifecycle: pending → confirmed → completed | cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    // The video meet link provided by the mentor after confirmation
    // This is shown on the user's dashboard once the mentor sends it
    meetLink: {
      type: String,
      default: null,
    },

    // Whether the system sent a notification to the mentor
    notificationSentToMentor: {
      type: Boolean,
      default: false,
    },

    // LLM-generated summary of the session (filled post-meeting)
    summary: {
      type: String,
      default: '',
    },

    // User-provided preferences at time of booking
    languagePreference: {
      type: String,
      default: 'en',
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'no_preference'],
      default: 'no_preference',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Session', sessionSchema);
