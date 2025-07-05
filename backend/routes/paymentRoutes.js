import express from 'express';
import { verifyPayment } from '../controllers/paymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/verify', protect, authorize('student'), verifyPayment);

export default router;
