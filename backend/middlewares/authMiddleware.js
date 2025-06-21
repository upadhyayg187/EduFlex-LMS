// backend/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Company from '../models/companyModel.js';
import Student from '../models/studentModel.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in cookie or Authorization header
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    // Fetch user based on role
    if (role === 'admin') {
      req.user = await Admin.findById(id).select('-password');
    } else if (role === 'company') {
      req.user = await Company.findById(id).select('-password');
    } else if (role === 'student') {
      req.user = await Student.findById(id).select('-password');
    }

    // --- THE IMPORTANT FIX IS HERE ---
    // If no user was found in the database with that ID, the token is invalid.
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found.' });
    }
    // --- END OF FIX ---

    req.user.role = role; // This line is now safe
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // Also check if req.user exists before checking the role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role is not authorized to access this route`,
      });
    }
    next();
  };
};