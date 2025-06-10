// backend/routes/courseRoutes.js
import express from 'express';
import { createCourse } from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Accept both a thumbnail and a video
router.route('/').post(
  protect,
  authorize('company'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  createCourse
);

export default router;
