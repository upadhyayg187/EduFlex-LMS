import express from 'express';
const router = express.Router();
import {
  registerCompany,
  updateCompanyPassword,
  getCompanyProfile,
  updateCompanyProfile,
  removeCompanyAvatar,
  getEnrolledStudents,
  getDashboardStats,
  getDashboardChartData // --- IMPORT NEW FUNCTION ---
} from '../controllers/companyController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

// --- ADD NEW ROUTE FOR CHART DATA ---
router.get('/dashboard-chart-data', protect, authorize('company'), getDashboardChartData);

router.get('/dashboard-stats', protect, authorize('company'), getDashboardStats);
router.get('/students', protect, authorize('company'), getEnrolledStudents);

// Public registration route
router.post('/signup', registerCompany);

// Protected profile routes
router.route('/profile')
    .get(protect, authorize('company'), getCompanyProfile)
    .put(protect, authorize('company'), upload.single('avatar'), updateCompanyProfile);

router.delete('/profile/avatar', protect, authorize('company'), removeCompanyAvatar);

// Protected security routes
router.put('/change-password', protect, authorize('company'), updateCompanyPassword);

export default router;
