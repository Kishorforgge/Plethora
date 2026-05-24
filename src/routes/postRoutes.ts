import { Router } from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
} from '../controllers/postController';
import { protect, optionalProtect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Public routes with optional auth (for personalization details)
router.get('/', optionalProtect, getPosts);
router.get('/:id', optionalProtect, getPostById);

// Protected routes
router.post('/upload', upload.single('image'), createPost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/unlike', unlikePost);
router.post('/:id/bookmark', bookmarkPost);
router.post('/:id/unbookmark', unbookmarkPost);

export default router;
