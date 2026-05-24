import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export declare const getNotifications: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/mark-read
 * @access  Private
 */
export declare const markNotificationsRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
