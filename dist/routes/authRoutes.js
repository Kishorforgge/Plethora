"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', validateMiddleware_1.validateRegister, authController_1.registerUser);
router.post('/login', validateMiddleware_1.validateLogin, authController_1.loginUser);
router.post('/logout', authController_1.logoutUser);
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map