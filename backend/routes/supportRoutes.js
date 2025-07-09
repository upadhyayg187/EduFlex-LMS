import express from 'express';
import {
  createTicket,
  getCompanyTickets,
  getTicketById,
  addReply,
  updateTicketStatus,
  getAllTicketsForAdmin
} from '../controllers/supportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- ADMIN ROUTES ---
router.get('/admin/all-tickets', protect, authorize('admin'), getAllTicketsForAdmin);
router.put('/status/:ticketId', protect, authorize('admin'), updateTicketStatus);

// --- COMPANY ROUTES ---
router.post('/', protect, authorize('company'), createTicket);
router.get('/my-tickets', protect, authorize('company'), getCompanyTickets);

// --- SHARED ROUTES ---
router.get('/:id', protect, authorize('company', 'admin'), getTicketById);
router.post('/reply/:ticketId', protect, authorize('company', 'admin'), addReply);

export default router;