const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.doctor_tracker_token;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.', code: 'UNAUTHENTICATED' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id email role').lean();
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Your session is no longer valid.', code: 'INVALID_SESSION' });
    }
    req.user = { id: String(user._id), email: user.email, role: user.role };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Your session is invalid or has expired. Please sign in again.', code: 'INVALID_SESSION' });
  }
}

module.exports = requireAuth;
