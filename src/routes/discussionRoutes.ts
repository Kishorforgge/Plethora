import { Router } from 'express';
import {
  getMyConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} from '../controllers/discussionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getMyConversations);
router.post('/', createConversation);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', sendMessage);
router.patch('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);

export default router;
