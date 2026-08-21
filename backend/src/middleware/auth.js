const jwt = require('jsonwebtoken');
const prisma = require('../db');

// Cache for default college ID to avoid repetitive queries
let defaultCollegeIdCache = null;

async function resolveDefaultCollegeId() {
  if (defaultCollegeIdCache) return defaultCollegeIdCache;
  try {
    let college = await prisma.college.findFirst();
    if (!college) {
      college = await prisma.college.create({
        data: { name: 'Main Campus University', domain: 'maincampus.edu' }
      });
    }
    defaultCollegeIdCache = college.id;
    return defaultCollegeIdCache;
  } catch (e) {
    console.error('[auth] Error resolving default college:', e);
    return null;
  }
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    
    let collegeId = user.collegeId || null;
    const userId = user.userId || user.id;

    // Self-healing: if admin/organizer has no collegeId in token, resolve from DB or assign default
    if (user.role === 'ADMIN' && !collegeId && userId) {
      try {
        const adminRec = await prisma.admin.findUnique({ where: { id: userId } });
        if (adminRec && adminRec.collegeId) {
          collegeId = adminRec.collegeId;
        } else {
          collegeId = await resolveDefaultCollegeId();
          if (adminRec && collegeId) {
            await prisma.admin.update({
              where: { id: userId },
              data: { collegeId }
            });
          }
        }
      } catch (dbErr) {
        console.error('[auth middleware] Admin college resolution error:', dbErr);
      }
    } else if (user.role === 'ORGANIZER' && !collegeId && userId) {
      try {
        const orgRec = await prisma.organizer.findUnique({ where: { id: userId } });
        if (orgRec && orgRec.collegeId) {
          collegeId = orgRec.collegeId;
        } else {
          collegeId = await resolveDefaultCollegeId();
        }
      } catch (_) {}
    }

    req.user = {
      ...user,
      id: userId,
      userId: userId,
      role: user.role,
      collegeId: collegeId,
    };
    next();
  });
};

const optionalAuthenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', async (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }

    let collegeId = user.collegeId || null;
    const userId = user.userId || user.id;

    if (user.role === 'ADMIN' && !collegeId && userId) {
      try {
        const adminRec = await prisma.admin.findUnique({ where: { id: userId } });
        if (adminRec && adminRec.collegeId) {
          collegeId = adminRec.collegeId;
        } else {
          collegeId = await resolveDefaultCollegeId();
        }
      } catch (_) {}
    } else if (user.role === 'ORGANIZER' && !collegeId && userId) {
      try {
        const orgRec = await prisma.organizer.findUnique({ where: { id: userId } });
        if (orgRec && orgRec.collegeId) {
          collegeId = orgRec.collegeId;
        } else {
          collegeId = await resolveDefaultCollegeId();
        }
      } catch (_) {}
    }

    req.user = {
      ...user,
      id: userId,
      userId: userId,
      role: user.role,
      collegeId: collegeId,
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
