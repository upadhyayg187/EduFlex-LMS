import express from 'express';
const router = express.Router();
import {
  registerCompany,
  updateCompanyPassword,
  getCompanyProfile,
  updateCompanyProfile
} from '../controllers/companyController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

// Public registration route
router.post('/signup', registerCompany);

// Protected profile routes
router.route('/profile')
    .get(protect, authorize('company'), getCompanyProfile)
    .put(protect, authorize('company'), upload.single('avatar'), updateCompanyProfile);

// Protected security routes
router.put('/change-password', protect, authorize('company'), updateCompanyPassword);

export default router;