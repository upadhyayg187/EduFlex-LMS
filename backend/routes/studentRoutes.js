import express from 'express';
const router = express.Router();

import {
  registerStudent,
  getStudentCourses,
  getStudentProgress,
  submitAssignment,
  getNotifications,
  updateProfile,
  getDashboardData // --- IMPORT NEW FUNCTION ---
} from '../controllers/studentController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

// --- ADD NEW ROUTE FOR DASHBOARD ---
router.get('/dashboard', protect, authorize('student'), getDashboardData);

// Public route
router.post('/signup', registerStudent);

// Protected Routes (only accessible by logged-in students)
router.get('/:id/courses', protect, authorize('student'), getStudentCourses);
router.get('/:id/progress', protect, authorize('student'), getStudentProgress);
router.post('/:id/assignments', protect, authorize('student'), submitAssignment);
router.get('/:id/notifications', protect, authorize('student'), getNotifications);
router.put('/:id/profile', protect, authorize('student'), updateProfile);

export default router;
