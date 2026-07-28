const jwt = require('jsonwebtoken');
const jsonDb = require('../data/jsonDb');
// We will use standard models if MongoDB is active, otherwise local JSON DB
const JWT_SECRET = process.env.JWT_SECRET || 'societyfix_jwt_super_secret_key_12345';

// Authenticate JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Role authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Role '${req.user ? req.user.role : 'Guest'}' is not authorized for this resource.` 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
