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
  getMyUploads,
  getMySaved,
  getMyLiked,
  getFollowingFeed,
  getUserUploads,
} from '../controllers/postController';
import { protect, optionalProtect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Public routes with optional auth (for personalization details)
router.get('/', optionalProtect, getPosts);
router.get('/following', protect, getFollowingFeed);
router.get('/me/uploads', protect, getMyUploads);
router.get('/me/saved', protect, getMySaved);
router.get('/me/liked', protect, getMyLiked);
router.get('/user/:userId/uploads', optionalProtect, getUserUploads);
router.get('/:id', optionalProtect, getPostById);

// Protected routes
router.post('/upload', protect, upload.single('image'), createPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/unlike', protect, unlikePost);
router.post('/:id/bookmark', protect, bookmarkPost);
router.post('/:id/unbookmark', protect, unbookmarkPost);

export default router;
