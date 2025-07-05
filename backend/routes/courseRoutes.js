import express from 'express';
import { 
    createCourse, 
    getCompanyCourses, 
    deleteCourse,
    getCourseByIdForOwner,
    updateCourse,
    getPublicCourseById,
    getPublicCourses,
    searchCourses,
    enrollInCourse,
    getEnrolledCourseForStudent // --- IMPORT NEW FUNCTION ---
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// --- STUDENT-PROTECTED COURSE VIEW ROUTE ---
router.route('/student/:id').get(protect, authorize('student'), getEnrolledCourseForStudent);


// --- PUBLIC ROUTES ---
router.route('/search').get(searchCourses);
router.route('/public').get(getPublicCourses);
router.route('/public/:id').get(getPublicCourseById);

// --- ENROLLMENT ROUTE ---
router.route('/:id/enroll').post(protect, authorize('student'), enrollInCourse);


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
