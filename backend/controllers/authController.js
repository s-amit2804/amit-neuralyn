const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Helper: generate JWT token valid for JWT_EXPIRES_IN duration
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '30d',
  });
};

// Helper: strip sensitive fields and return safe user object
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  mentorType: user.mentorType,
  specialization: user.specialization,
  organization: user.organization,
  gender: user.gender,
  language: user.language,
  ageGroup: user.ageGroup,
});

// ─────────────────────────────────────────────
// @desc    Register a new user/mentor/ngo staff
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, organizationId, gender, language, ageGroup } = req.body;

    // Validate that the organization exists before creating the user
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found. Please provide a valid organization ID.',
      });
    }

    // Prevent duplicate accounts
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Force role to 'user' for public registration.
    // Mentors and NGO admins cannot sign up through this route.
    const user = await User.create({
      name,
      email,
      password,
      role: 'user', 
      organization: organizationId,
      gender,
      language: language || 'en',
      ageGroup,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: { ...sanitizeUser(user), token },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Login with email + password
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // --- MOCK USER BYPASS ---
    if (email === 'user@gmail.com' && password === 'user') {
      const mockUser = {
        _id: 'mock_user_id_12345',
        name: 'Sample User',
        email: 'user@gmail.com',
        role: 'user',
        gender: 'female',
        language: 'en',
        ageGroup: '18-24'
      };
      const token = generateToken(mockUser._id);
      return res.json({
        success: true,
        data: { ...mockUser, token },
      });
    }
    // ------------------------

    // Explicitly select password as it's excluded by default (select: false)
    const user = await User.findOne({ email }).select('+password').populate('organization', 'name type');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { ...sanitizeUser(user), token },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    // --- MOCK USER BYPASS ---
    if (req.user._id === 'mock_user_id_12345') {
      return res.json({
        success: true,
        data: req.user,
      });
    }
    // ------------------------

    // req.user is set by the auth middleware after JWT verification
    const user = await User.findById(req.user._id).populate('organization', 'name type location');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update current logged-in user profile
// @route   PUT /api/auth/me
// @access  Private
// ─────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const allowedFields = ['name', 'gender', 'language', 'ageGroup', 'mentorType', 'specialization'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.organizationId) {
      const org = await Organization.findById(req.body.organizationId);
      if (!org) {
        return res.status(400).json({
          success: false,
          message: 'Organization not found. Please provide a valid organization ID.',
        });
      }
      updates.organization = org._id;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate('organization', 'name type location');

    res.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all organizations (for registration dropdown)
// @route   GET /api/auth/organizations
// @access  Public
// ─────────────────────────────────────────────
exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find().select('name type location');
    res.json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Create an organization (admin only)
// @route   POST /api/auth/organizations
// @access  Private/Admin
// ─────────────────────────────────────────────
exports.createOrganization = async (req, res) => {
  try {
    const org = await Organization.create(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    // Handle duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this name already exists. Please use the existing ID or choose a different name.',
      });
    }
    console.error('Error in createOrganization:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
