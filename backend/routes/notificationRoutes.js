import express from 'express';
import { 
    getNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes are protected for ANY logged-in user
router.use(protect);

router.route('/').get(getNotifications);
router.route('/read-all').patch(markAllNotificationsAsRead);
router.route('/:id/read').patch(markNotificationAsRead);

export default router;