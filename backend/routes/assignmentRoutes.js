import express from 'express';
import { 
    createAssignment, 
    getAssignmentsForCompany,
    getSubmissionsForAssignment,
    deleteAssignment,
    getAssignmentById,
    updateAssignment
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('company'), createAssignment)
    .get(protect, authorize('company'), getAssignmentsForCompany);

// Routes for getting, updating, and deleting a specific assignment
router.route('/:id')
    .get(protect, authorize('company'), getAssignmentById)
    .put(protect, authorize('company'), updateAssignment)
    .delete(protect, authorize('company'), deleteAssignment);

router.route('/:id/submissions')
    .get(protect, authorize('company'), getSubmissionsForAssignment);

export default router;