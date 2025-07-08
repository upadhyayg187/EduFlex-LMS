import express from 'express';
import { 
    getDashboardStats,
    getAllCompanies,
    deleteCompanyAndContent,
    updateCompanyStatus,
    getAllStudents,
    deleteStudent,
    getAllCourses,
    deleteCourseByAdmin,
    getPlatformSettings,
    updatePlatformSettings,
    updateAdminPassword
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

// Company Management
router.get('/companies', getAllCompanies);
router.delete('/companies/:id', deleteCompanyAndContent);
router.put('/companies/:id/status', updateCompanyStatus);

// Student Management
router.get('/students', getAllStudents);
router.delete('/students/:id', deleteStudent);

// Course Management
router.get('/courses', getAllCourses);
router.delete('/courses/:id', deleteCourseByAdmin);

// --- NEW PLATFORM SETTINGS ROUTES ---
router.route('/settings')
    .get(getPlatformSettings)
    .put(upload.single('logo'), updatePlatformSettings);
router.put('/change-password', updateAdminPassword);

export default router;
