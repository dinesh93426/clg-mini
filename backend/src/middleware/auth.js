const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    req.user = {
      ...user,
      id: user.id || user.userId,
      userId: user.userId || user.id,
      role: user.role,
      collegeId: user.collegeId || null,
    };
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = {
      ...user,
      id: user.id || user.userId,
      userId: user.userId || user.id,
      role: user.role,
      collegeId: user.collegeId || null,
    };
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access. Role restricted.' });
    }
    next();
  };
};

module.exports = { authenticateToken, optionalAuthenticateToken, authorizeRoles };

