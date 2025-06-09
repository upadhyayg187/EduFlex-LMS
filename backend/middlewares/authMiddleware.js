import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Company from '../models/Company.js';
import Student from '../models/Student.js';

const protect = async (req, res, next) => {
  let token;
  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user to the request object
      // This is flexible and finds the user from any collection
      req.user =
        (await Admin.findById(decoded.userId).select('-password')) ||
        (await Company.findById(decoded.userId).select('-password')) ||
        (await Student.findById(decoded.userId).select('-password'));
      
      req.role = decoded.role; // Attach role to the request

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: `Role '${req.role}' is not authorized to access this route` });
    }
    next();
  };
};


export { protect, authorize };