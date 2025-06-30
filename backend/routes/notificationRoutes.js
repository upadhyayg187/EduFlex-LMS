import express from 'express';
import { 
    getNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes are protected and authorized for 'company' role
router.use(protect, authorize('company'));

router.route('/')
    .get(getNotifications);

router.route('/read-all')
    .patch(markAllNotificationsAsRead);

router.route('/:id/read')
    .patch(markNotificationAsRead);

export default router;