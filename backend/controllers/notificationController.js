import Notification from '../models/notificationModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(req.query.limit || 50); // Allow limiting results, default 50
    res.status(200).json(notifications);
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        return res.status(404).json({ message: 'Notification not found.' });
    }
    if (notification.recipient.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized.' });
    }
    notification.read = true;
    await notification.save();
    res.status(200).json(notification);
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { $set: { read: true } }
    );
    res.status(200).json({ message: 'All notifications marked as read.' });
});