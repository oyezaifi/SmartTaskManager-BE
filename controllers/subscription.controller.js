const User = require('../models/User');

async function upgrade(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { role: 'premium' } }, { new: true }).select('email name role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { upgrade };


