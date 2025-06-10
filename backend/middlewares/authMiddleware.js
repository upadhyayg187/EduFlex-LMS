// backend/middlewares/authMiddleware.js

import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Company from '../models/companyModel.js';
import Student from '../models/studentModel.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, role } = decoded;

      if (role === 'admin') {
        req.user = await Admin.findById(id).select('-password');
      } else if (role === 'company') {
        req.user = await Company.findById(id).select('-password');
      } else if (role === 'student') {
        req.user = await Student.findById(id).select('-password');
      }

      req.user.role = role;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
