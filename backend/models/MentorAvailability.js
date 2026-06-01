const mongoose = require('mongoose');

// Each slot represents one available time block a mentor offers for a given day
const slotSchema = new mongoose.Schema({
  startTime: {
    type: String, // Format: "HH:MM" e.g. "14:00"
    required: true,
  },
  endTime: {
    type: String, // Format: "HH:MM" e.g. "15:00"
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false, // Flipped to true when a user books this slot
  },
});

const mentorAvailabilitySchema = new mongoose.Schema(
  {
    // The mentor who owns this availability block
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The calendar date for this set of slots (stored as date-only)
    date: {
      type: Date,
      required: true,
    },

    // One or more time slots the mentor is available on this date
    slots: [slotSchema],

    // Mentor's language of communication (used for matching users)
    language: {
      type: String,
      default: 'en',
    },

    // Mentor's gender (exposed so users can set gender preference when booking)
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer_not_to_say'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one availability document per mentor per date
mentorAvailabilitySchema.index({ mentor: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MentorAvailability', mentorAvailabilitySchema);
