const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('email name role createdAt updatedAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name } = req.body || {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('email name role createdAt updatedAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMe, updateProfile, changePassword };


