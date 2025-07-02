import express from 'express';
import { 
    createCourse, 
    getCompanyCourses, 
    deleteCourse,
    getCourseByIdForOwner,
    updateCourse,
    getPublicCourseById,
    getPublicCourses
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// --- PUBLIC ROUTES ---
router.route('/public').get(getPublicCourses);
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
    .put(
        protect,
        authorize('company'),
        upload.fields([
            { name: 'thumbnail', maxCount: 1 },
            { name: 'videos' }
        ]),
        updateCourse
    )
    .delete(protect, authorize('company'), deleteCourse);

export default router;
