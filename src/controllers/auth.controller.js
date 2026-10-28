const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function cookieOptions() {
  const production = process.env.NODE_ENV === 'production';
  const configuredSameSite = String(process.env.COOKIE_SAME_SITE || (production ? 'none' : 'lax')).toLowerCase();
  const sameSite = ['lax', 'strict', 'none'].includes(configuredSameSite) ? configuredSameSite : 'lax';
  return {
    httpOnly: true,
    secure: production || sameSite === 'none',
    sameSite,
    path: '/',
    maxAge: 100 * 24 * 60 * 60 * 1000,
  };
}

async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const matches = user && await bcrypt.compare(password, user.passwordHash);
  if (!matches) return res.status(401).json({ message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '100d',
  });
  res.cookie('doctor_tracker_token', token, cookieOptions());
  return res.json({ user: { id: user._id.toString(), email: user.email, role: user.role } });
}

async function me(req, res) {
  return res.json({ user: req.user });
}

async function logout(req, res) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie('doctor_tracker_token', options);
  return res.json({ message: 'Signed out successfully.' });
}

module.exports = { login, me, logout };
