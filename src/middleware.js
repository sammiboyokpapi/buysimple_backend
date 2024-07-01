const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('./auth');
const secretKey = 'yourSecretKey';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  if (isTokenBlacklisted(token)) {
    return res.status(403).json({ message: 'Token is invalidated' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token', error: err.message });
    }

    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
