import express from 'express';
const router = express.Router();
import { upload } from '../config/cloudinary.js';
// Import protect and authorize middleware
import { protect, authorize } from '../middlewares/authMiddleware.js'; // ADD THIS LINE

import {
  getNotifications,
  updateProfile,
  getDashboardData,
  getEnrolledCourses,
  saveCourseProgress,
  getMyProgressOverview,
  getStudentAssignments,
  getStudentProfile,
  updateStudentPassword,
  removeStudentAvatar,
  getMyCertificates,
  getCertificateById,
} from '../controllers/studentController.js';

// All student routes require protection and student authorization
//
router.use(protect, authorize('student'));

router.route('/profile')
    .get(getStudentProfile)
    .put(upload.single('avatar'), updateProfile);
router.delete('/profile/avatar', removeStudentAvatar);
router.put('/change-password', updateStudentPassword);

router.post('/progress', saveCourseProgress);
router.get('/my-progress-overview', getMyProgressOverview);
router.get('/dashboard', getDashboardData);
router.get('/my-courses', getEnrolledCourses);
router.get('/my-assignments', getStudentAssignments);

// Note: The getNotifications endpoint here might conflict or be redundant if a global notifications route exists.
// Your existing notificationController.js already handles /api/notifications.
// It's generally better to use the notificationController directly via its own route.
// If you intend for this to be student-specific, ensure proper differentiation.
router.get('/:id/notifications', getNotifications);


// --- NEW ROUTES FOR CERTIFICATES ---
router.route('/certificates')
    .get(getMyCertificates);
    
router.route('/certificates/:id')
    .get(getCertificateById);


export default router;