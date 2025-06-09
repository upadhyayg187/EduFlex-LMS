import express from 'express';
const router = express.Router();
import { registerCompany } from '../controllers/companyController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

router.post('/signup', registerCompany);
// Example of a protected company route
// router.post('/courses', protect, authorize('company'), createCourse);

export default router;


