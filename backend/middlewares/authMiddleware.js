import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Company from '../models/companyModel.js';
import Student from '../models/studentModel.js';

export const protect = async (req, res, next) => {
  let token;

  // --- FIX: We will ONLY look for the Bearer token in the header ---
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, role } = decoded;

      // Get user from the database
      if (role === 'admin') {
        req.user = await Admin.findById(id).select('-password').lean();
      } else if (role === 'company') {
        req.user = await Company.findById(id).select('-password').lean();
      } else if (role === 'student') {
        req.user = await Student.findById(id).select('-password').lean();
      }

      if (!req.user) {
          return res.status(401).json({ message: 'Not authorized, user not found.' });
      }

      req.user.role = role;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};
