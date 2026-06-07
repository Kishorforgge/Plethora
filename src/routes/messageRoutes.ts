import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getConversations, getOrCreateConversation, markAsRead } from '../controllers/messageController';

const router = Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversation', getOrCreateConversation);
router.put('/conversations/:id/read', markAsRead);

export default router;
