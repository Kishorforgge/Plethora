import { Router } from 'express';
import {
  updateProfile,
  updateProfilePicture,
  followUser,
  unfollowUser,
  searchUsers,
  getUserProfile,
  getSuggestedCreators,
  getMyFollowers,
  getMyFollowing,
  getUserFollowers,
  getUserFollowing,
  searchFollowersAndFollowing,
  removeFollower,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
  getUserProfileByUsername,
} from '../controllers/userController';
import { protect, optionalProtect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import { validateProfileUpdate } from '../middleware/validateMiddleware';

const router = Router();

// Public routes (or optionally authenticated)
router.get('/search', optionalProtect, searchUsers);
router.get('/suggested', protect, getSuggestedCreators);
router.get('/me/followers', protect, getMyFollowers);
router.get('/me/following', protect, getMyFollowing);
router.get('/followers', protect, getMyFollowers);
router.get('/following', protect, getMyFollowing);
router.get('/search-followers', protect, searchFollowersAndFollowing);
router.get('/:userId/followers', protect, getUserFollowers);
router.get('/:userId/following', protect, getUserFollowing);
router.get('/profile/:username', optionalProtect, getUserProfileByUsername);
router.get('/:username', optionalProtect, getUserProfile);

// Protected routes
router.put('/profile', protect, validateProfileUpdate, updateProfile);
router.put('/profile-picture', protect, upload.single('image'), updateProfilePicture);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.post('/:id/remove-follower', protect, removeFollower);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);
router.post('/:id/mute', protect, muteUser);
router.post('/:id/unmute', protect, unmuteUser);

export default router;
