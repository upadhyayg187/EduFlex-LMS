import express from 'express';
import {
  createTicket,
  getCompanyTickets,
  getTicketById,
  addReply,
  updateTicketStatus
} from '../controllers/supportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Company routes
router.route('/').post(protect, authorize('company'), createTicket);
router.route('/my-tickets').get(protect, authorize('company'), getCompanyTickets);

// Shared routes for company and admin
router.route('/:id').get(protect, authorize('company', 'admin'), getTicketById);
router.route('/reply/:ticketId').post(protect, authorize('company', 'admin'), addReply);

// Admin-only routes
router.route('/status/:ticketId').put(protect, authorize('admin'), updateTicketStatus);

export default router;