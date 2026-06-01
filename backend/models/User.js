const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Never returned in queries by default
    },

    // Role determines access:
    // 'user'      → youth seeking support
    // 'mentor'    → trained peer volunteer
    // 'ngo'       → NGO staff with dashboard access
    // 'admin'     → platform admin
    role: {
      type: String,
      enum: ['user', 'mentor', 'ngo', 'admin'],
      default: 'user',
    },

    mentorType: {
      type: String,
      enum: ['peer', 'professional'],
      default: undefined,
    },

    specialization: {
      type: String,
      default: '',
      trim: true,
    },

    // Organization the user belongs to (school / NGO)
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },

    // Used for mentor matching preferences and analytics grouping
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer_not_to_say'],
    },

    // Language preference for mentor matching
    language: {
      type: String,
      default: 'en',
    },

    // Age group for NGO analytics dashboard breakdowns
    ageGroup: {
      type: String,
      enum: ['13-15', '16-18', '19-21', '22-25'],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving any user document
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare login password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
