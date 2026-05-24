import { Router } from 'express';
import {
  updateProfile,
  updateProfilePicture,
  followUser,
  unfollowUser,
  searchUsers,
  getUserProfile,
} from '../controllers/userController';
import { protect, optionalProtect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { validateProfileUpdate } from '../middleware/validateMiddleware';

const router = Router();

// Public routes (or optionally authenticated)
router.get('/search', searchUsers);
router.get('/:username', optionalProtect, getUserProfile);

// Protected routes
router.put('/profile', protect, validateProfileUpdate, updateProfile);
router.put('/profile-picture', protect, upload.single('image'), updateProfilePicture);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

export default router;
