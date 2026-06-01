const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      unique: true,
      trim: true,
    },

    // Type determines NGO vs school context in dashboard analytics
    type: {
      type: String,
      enum: ['ngo', 'school', 'clinic', 'community'],
      required: true,
    },

    contactEmail: {
      type: String,
      required: true,
    },

    // City/region for geographic filtering in NGO dashboard
    location: {
      type: String,
    },
  }
);

module.exports = mongoose.model('Organization', organizationSchema);
