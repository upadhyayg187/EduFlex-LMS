import Notification from '../models/notificationModel.js';

// @desc    Get all notifications for the logged-in user (company)
// @route   GET /api/notifications
// @access  Private/Company
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching notifications.' });
    }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private/Company
export const markNotificationAsRead = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private/Company
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};