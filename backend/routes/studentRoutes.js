import express from 'express';
const router = express.Router();
import { registerStudent } from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

router.post('/signup', registerStudent);
// Example of a protected student route
// router.get('/profile', protect, authorize('student'), getStudentProfile);

export default router;
