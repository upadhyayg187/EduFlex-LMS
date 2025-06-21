/*

LOCATION: backend/routes/courseRoutes.js

*/
import express from 'express';
// Import all necessary controller functions
import { createCourse, getCompanyCourses, deleteCourse } from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// This single route path ('/') handles two different HTTP methods:
// GET: Fetches all courses for the logged-in company.
// POST: Creates a new course.
router.route('/')
    .get(
        protect,
        authorize('company'),
        getCompanyCourses
    )
    .post(
        protect,
        authorize('company'),
        upload.fields([
            { name: 'thumbnail', maxCount: 1 },
            { name: 'videos', maxCount: 20 }
        ]),
        createCourse
    );

// This route handles actions for a specific course by its ID.
// DELETE: Deletes a specific course.
// You can add GET (for a single course) and PUT (for updates) here later.
router.route('/:id')
    .delete(
        protect,
        authorize('company'),
        deleteCourse
    );

export default router;
