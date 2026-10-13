import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getAccessToken = (req) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7);
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'default_jwt_secret_please_change'
    );
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid authentication' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }
    return next(error);
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  return next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'default_jwt_secret_please_change'
    );
    const user = await User.findById(decoded.id);
    req.user = user && user.isActive ? user : null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
};

