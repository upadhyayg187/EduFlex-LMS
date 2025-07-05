import express from 'express';
import { createSubmission } from '../controllers/submissionController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Route for a student to submit an assignment file
router.route('/').post(
    protect, 
    authorize('student'), 
    upload.single('submissionFile'), // Expects a file with the field name 'submissionFile'
    createSubmission
);

export default router;
