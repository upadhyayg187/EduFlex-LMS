import express from 'express';
const router = express.Router();

import {
  registerStudent,
  getStudentCourses,
  getStudentProgress,
  submitAssignment,
  getNotifications,
  updateProfile
} from '../controllers/studentController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

// Public route
router.post('/signup', registerStudent);  // Use lowercase 'signup' for consistency

// Protected Routes (only accessible by logged-in students)
router.get('/:id/courses', protect, authorize('student'), getStudentCourses);
router.get('/:id/progress', protect, authorize('student'), getStudentProgress);
router.post('/:id/assignments', protect, authorize('student'), submitAssignment);
router.get('/:id/notifications', protect, authorize('student'), getNotifications);
router.put('/:id/profile', protect, authorize('student'), updateProfile);

export default router;
