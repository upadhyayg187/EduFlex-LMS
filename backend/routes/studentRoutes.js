import express from 'express';
const router = express.Router();
import { upload } from '../config/cloudinary.js';

import {
  registerStudent,
  getNotifications,
  updateProfile,
  getDashboardData,
  getEnrolledCourses,
  saveCourseProgress,
  getMyProgressOverview,
  getStudentAssignments,
  getStudentProfile,
  updateStudentPassword,
  removeStudentAvatar
} from '../controllers/studentController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

// --- Profile and Settings Routes ---
router.route('/profile')
    .get(protect, authorize('student'), getStudentProfile)
    .put(protect, authorize('student'), upload.single('avatar'), updateProfile);
router.delete('/profile/avatar', protect, authorize('student'), removeStudentAvatar);
router.put('/change-password', protect, authorize('student'), updateStudentPassword);

// --- Course and Progress Routes ---
router.post('/progress', protect, authorize('student'), saveCourseProgress);
router.get('/my-progress-overview', protect, authorize('student'), getMyProgressOverview);
router.get('/dashboard', protect, authorize('student'), getDashboardData);
router.get('/my-courses', protect, authorize('student'), getEnrolledCourses);
router.get('/my-assignments', protect, authorize('student'), getStudentAssignments);

// --- Public Signup Route ---
router.post('/signup', registerStudent);

// --- Other Routes ---
router.get('/:id/notifications', protect, authorize('student', 'admin'), getNotifications);

export default router;
