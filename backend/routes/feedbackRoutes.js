import express from 'express';
import { submitFeedback, getReviewsForCompany } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route for a student to submit feedback
router.post('/', protect, authorize('student'), submitFeedback);

// Route for a company to get all reviews for their courses
router.get('/company', protect, authorize('company'), getReviewsForCompany);

export default router;