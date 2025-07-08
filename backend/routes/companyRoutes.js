import express from 'express';
const router = express.Router();
import {
  updateCompanyPassword,
  getCompanyProfile,
  updateCompanyProfile,
  removeCompanyAvatar,
  getEnrolledStudents,
  getDashboardStats,
  getDashboardChartData,
  getStudentProfileForCompany,
  removeStudentFromCourses
} from '../controllers/companyController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

// Student Management by Company
router.route('/student/:studentId')
    .get(protect, authorize('company'), getStudentProfileForCompany)
    .delete(protect, authorize('company'), removeStudentFromCourses);

// Company Dashboard & Student List
router.get('/dashboard-stats', protect, authorize('company'), getDashboardStats);
router.get('/dashboard-chart-data', protect, authorize('company'), getDashboardChartData);
router.get('/students', protect, authorize('company'), getEnrolledStudents);

// Company Profile & Settings
router.route('/profile')
    .get(protect, authorize('company'), getCompanyProfile)
    .put(protect, authorize('company'), upload.single('avatar'), updateCompanyProfile);
router.delete('/profile/avatar', protect, authorize('company'), removeCompanyAvatar);
router.put('/change-password', protect, authorize('company'), updateCompanyPassword);

export default router;
