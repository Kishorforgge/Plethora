"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// Public routes with optional auth (for personalization details)
router.get('/', authMiddleware_1.optionalProtect, postController_1.getPosts);
router.get('/following', authMiddleware_1.protect, postController_1.getFollowingFeed);
router.get('/me/uploads', authMiddleware_1.protect, postController_1.getMyUploads);
router.get('/me/saved', authMiddleware_1.protect, postController_1.getMySaved);
router.get('/me/liked', authMiddleware_1.protect, postController_1.getMyLiked);
router.get('/user/:userId/uploads', authMiddleware_1.optionalProtect, postController_1.getUserUploads);
router.get('/:id', authMiddleware_1.optionalProtect, postController_1.getPostById);
// Protected routes
router.post('/upload', authMiddleware_1.protect, uploadMiddleware_1.upload.single('image'), postController_1.createPost);
router.delete('/:id', authMiddleware_1.protect, postController_1.deletePost);
router.post('/:id/like', authMiddleware_1.protect, postController_1.likePost);
router.post('/:id/unlike', authMiddleware_1.protect, postController_1.unlikePost);
router.post('/:id/bookmark', authMiddleware_1.protect, postController_1.bookmarkPost);
router.post('/:id/unbookmark', authMiddleware_1.protect, postController_1.unbookmarkPost);
exports.default = router;
//# sourceMappingURL=postRoutes.js.map