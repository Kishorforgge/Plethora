"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const validateMiddleware_1 = require("../middleware/validateMiddleware");
const authMiddleware_1 = require("../middleware/authMiddleware");
const generateToken_1 = require("../utils/generateToken");
const router = (0, express_1.Router)();
router.post('/register', validateMiddleware_1.validateRegister, authController_1.registerUser);
router.post('/login', validateMiddleware_1.validateLogin, authController_1.loginUser);
router.post('/logout', authController_1.logoutUser);
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
// Google OAuth login route
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
// Google OAuth callback route
router.get('/google/callback', (req, res, next) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '');
    console.log(`[Google OAuth Callback] Route triggered. CLIENT_URL config: ${process.env.CLIENT_URL}, Normalized clientUrl: ${clientUrl}`);
    next();
}, passport_1.default.authenticate('google', {
    failureRedirect: `${(process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '')}/login?error=oauth_failed`
}), (req, res) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '');
    if (req.user) {
        const token = (0, generateToken_1.generateToken)(req.user._id.toString());
        console.log(`[Google OAuth Callback] Success: Generated JWT token: ${token}`);
        const redirectUrl = `${clientUrl}/login-success?token=${token}`;
        console.log(`[Google OAuth Callback] Redirecting user to: ${redirectUrl}`);
        res.redirect(redirectUrl);
    }
    else {
        console.error('[Google OAuth Callback] Failure: No req.user found.');
        const redirectUrl = `${clientUrl}/login?error=no_user`;
        console.log(`[Google OAuth Callback] Redirecting user to: ${redirectUrl}`);
        res.redirect(redirectUrl);
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map