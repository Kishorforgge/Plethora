"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Protected routes only
router.get('/', authMiddleware_1.protect, notificationController_1.getNotifications);
router.put('/mark-read', authMiddleware_1.protect, notificationController_1.markNotificationsRead);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map