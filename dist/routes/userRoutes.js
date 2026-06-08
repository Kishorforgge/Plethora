"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const router = (0, express_1.Router)();
// Public routes (or optionally authenticated)
router.get('/search', authMiddleware_1.optionalProtect, userController_1.searchUsers);
router.get('/suggested', authMiddleware_1.protect, userController_1.getSuggestedCreators);
router.get('/me/followers', authMiddleware_1.protect, userController_1.getMyFollowers);
router.get('/me/following', authMiddleware_1.protect, userController_1.getMyFollowing);
router.get('/followers', authMiddleware_1.protect, userController_1.getMyFollowers);
router.get('/following', authMiddleware_1.protect, userController_1.getMyFollowing);
router.get('/search-followers', authMiddleware_1.protect, userController_1.searchFollowersAndFollowing);
router.get('/:userId/followers', authMiddleware_1.protect, userController_1.getUserFollowers);
router.get('/:userId/following', authMiddleware_1.protect, userController_1.getUserFollowing);
router.get('/profile/:username', authMiddleware_1.optionalProtect, userController_1.getUserProfileByUsername);
router.get('/:username', authMiddleware_1.optionalProtect, userController_1.getUserProfile);
// Protected routes
router.put('/profile', authMiddleware_1.protect, validateMiddleware_1.validateProfileUpdate, userController_1.updateProfile);
router.put('/profile-picture', authMiddleware_1.protect, uploadMiddleware_1.upload.single('image'), userController_1.updateProfilePicture);
router.post('/:id/follow', authMiddleware_1.protect, userController_1.followUser);
router.post('/:id/unfollow', authMiddleware_1.protect, userController_1.unfollowUser);
router.post('/:id/remove-follower', authMiddleware_1.protect, userController_1.removeFollower);
router.post('/:id/block', authMiddleware_1.protect, userController_1.blockUser);
router.post('/:id/unblock', authMiddleware_1.protect, userController_1.unblockUser);
router.post('/:id/mute', authMiddleware_1.protect, userController_1.muteUser);
router.post('/:id/unmute', authMiddleware_1.protect, userController_1.unmuteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map