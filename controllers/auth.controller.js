const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signAccessToken(userId) {
  return jwt.sign({}, process.env.JWT_ACCESS_SECRET, {
    subject: String(userId),
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '8h'
  });
}

function signRefreshToken(userId) {
  return jwt.sign({}, process.env.JWT_REFRESH_SECRET, {
    subject: String(userId),
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  });
}

function setAuthCookies(res, accessToken, refreshToken) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 10000 * 60 * 15
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 10000 * 60 * 60 * 24 * 7
  });
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({ email, passwordHash, name: name || '' });
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);
    return res.status(201).json({ 
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      accessToken 
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);
    return res.json({ 
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      accessToken 
    });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    const accessToken = signAccessToken(decoded.sub);
    const newRefreshToken = signRefreshToken(decoded.sub);
    setAuthCookies(res, accessToken, newRefreshToken);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

function logout(req, res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.json({ ok: true });
}

module.exports = {
  register,
  login,
  refresh,
  logout
};


