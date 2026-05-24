"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationsRead = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
    const userId = req.user?._id;
    try {
        const notifications = await Notification_1.Notification.find({ receiver: userId })
            .populate('sender', 'username fullName profilePicture')
            .populate({
            path: 'post',
            select: 'imageUrl',
        })
            .populate({
            path: 'comment',
            select: 'text',
        })
            .sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            results: notifications.length,
            data: notifications,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/mark-read
 * @access  Private
 */
const markNotificationsRead = async (req, res, next) => {
    const userId = req.user?._id;
    try {
        const result = await Notification_1.Notification.updateMany({ receiver: userId, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({
            status: 'success',
            message: 'All notifications marked as read.',
            updatedCount: result.modifiedCount,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationsRead = markNotificationsRead;
//# sourceMappingURL=notificationController.js.map