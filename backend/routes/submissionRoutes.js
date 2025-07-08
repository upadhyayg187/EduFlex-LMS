import express from 'express';
import { createSubmission, gradeSubmission } from '../controllers/submissionController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Route for a student to submit an assignment file
router.route('/').post(
    protect, 
    authorize('student'), 
    upload.single('submissionFile'),
    createSubmission
);

// Route for a company to grade a submission
router.route('/:id/grade').put(protect, authorize('company'), gradeSubmission);

export default router;
