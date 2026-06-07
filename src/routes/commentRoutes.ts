import { Router } from 'express';
import {
  addComment,
  getCommentsByPost,
  deleteComment,
  updateComment,
} from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';
import { validateComment } from '../middleware/validateMiddleware';

const router = Router();

// Public routes
router.get('/:postId', getCommentsByPost);

// Protected routes
router.post('/:postId', protect, validateComment, addComment);
router.put('/:commentId', protect, validateComment, updateComment);
router.delete('/:commentId', protect, deleteComment);

export default router;
