import express from 'express';
import { getAISupport } from '../controllers/aiSupportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected so only logged-in company users can use the AI assistant
router.route('/').post(protect, authorize('company'), getAISupport);

export default router;