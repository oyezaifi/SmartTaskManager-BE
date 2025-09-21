const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const bearer = req.headers.authorization || '';
  const headerToken = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;
  const cookieToken = req.cookies && req.cookies.accessToken ? req.cookies.accessToken : null;
  const token = headerToken || cookieToken;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;


