import express from 'express';
import { 
    createCourse, 
    getCompanyCourses, 
    deleteCourse,
    getCourseByIdForOwner,
    updateCourse,
    getPublicCourseById 
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// --- PUBLIC ROUTE ---
router.route('/public/:id').get(getPublicCourseById);

// --- COMPANY-PROTECTED ROUTES ---
router.route('/')
    .get(protect, authorize('company'), getCompanyCourses)
    .post(
        protect,
        authorize('company'),
        upload.fields([
            { name: 'thumbnail', maxCount: 1 },
            { name: 'videos', maxCount: 20 }
        ]),
        createCourse
    );

router.route('/:id')
    .get(protect, authorize('company'), getCourseByIdForOwner)
    // --- THIS IS THE FIX ---
    // The middleware is now changed from upload.single() to upload.fields()
    // to accept both a thumbnail and new videos during an update.
    .put(
        protect,
        authorize('company'),
        upload.fields([
            { name: 'thumbnail', maxCount: 1 },
            { name: 'videos' } // Allow multiple new videos
        ]),
        updateCourse
    )
    // --- END OF FIX ---
    .delete(protect, authorize('company'), deleteCourse);

export default router;