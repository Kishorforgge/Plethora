"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discussionController_1 = require("../controllers/discussionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.get('/', discussionController_1.getMyConversations);
router.post('/', discussionController_1.createConversation);
router.get('/:id/messages', discussionController_1.getConversationMessages);
router.post('/:id/messages', discussionController_1.sendMessage);
router.patch('/messages/:messageId', discussionController_1.editMessage);
router.delete('/messages/:messageId', discussionController_1.deleteMessage);
exports.default = router;
//# sourceMappingURL=discussionRoutes.js.map