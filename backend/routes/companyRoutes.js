import express from 'express';
const router = express.Router();

import {
  registerCompany,
  updateCompanyPassword,
} from '../controllers/companyController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

// @route   POST /api/companies/SignUp
// @desc    Register a new company
// @access  Public
router.post('/SignUp', registerCompany);

// @route   POST /api/companies/update-password
// @desc    Update company password
// @access  Private (Company only)
router.post(
  '/update-password',
  protect,
  authorize('company'),
  updateCompanyPassword
);

export default router;
