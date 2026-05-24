import { Router } from 'express';
import {
  getNotifications,
  markNotificationsRead,
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Protected routes only
router.get('/', protect, getNotifications);
router.put('/mark-read', protect, markNotificationsRead);

export default router;
