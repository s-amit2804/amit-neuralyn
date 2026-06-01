const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// protect — validates JWT token from Authorization header and attaches the
// authenticated user to req.user for downstream controllers
// ─────────────────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Expect "Authorization: Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.',
      });
    }

    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // MOCK USER BYPASS
    if (decoded.id === 'mock_user_id_12345') {
       req.user = {
         _id: 'mock_user_id_12345',
         name: 'Sample User',
         email: 'user@gmail.com',
         role: 'user',
         gender: 'female',
         language: 'en',
         ageGroup: '18-24'
       };
       return next();
    }

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).populate('organization', 'name type');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// authorize — role-based access control gate
// Usage: router.get('/admin-only', protect, authorize('admin', 'ngo'), handler)
// ─────────────────────────────────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires one of the following roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
