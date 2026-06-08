"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/:postId', commentController_1.getCommentsByPost);
// Protected routes
router.post('/:postId', authMiddleware_1.protect, validateMiddleware_1.validateComment, commentController_1.addComment);
router.put('/:commentId', authMiddleware_1.protect, validateMiddleware_1.validateComment, commentController_1.updateComment);
router.delete('/:commentId', authMiddleware_1.protect, commentController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=commentRoutes.js.map