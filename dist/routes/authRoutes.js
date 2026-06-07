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
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const clientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;
    passport_1.default.authenticate('google', {
        failureRedirect: `${clientUrl}/login?error=oauth_failed`,
    })(req, res, next);
}, (req, res) => {
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const clientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;
    if (req.user) {
        const token = (0, generateToken_1.generateToken)(req.user._id.toString());
        console.log("================ Google OAuth Callback Success ================");
        console.log("CLIENT_URL (raw) =", process.env.CLIENT_URL);
        console.log("CLIENT_URL (normalized) =", clientUrl);
        console.log("GOOGLE_CALLBACK_URL =", process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback');
        console.log("Generated JWT Token =", token);
        console.log("Redirect URL =", `${clientUrl}/login-success?token=${token}`);
        console.log("===============================================================");
        res.redirect(`${clientUrl}/login-success?token=${token}`);
    }
    else {
        console.log("================ Google OAuth Callback Failure ================");
        console.log("No user found in session.");
        console.log("Redirecting to /login?error=no_user");
        console.log("===============================================================");
        res.redirect(`${clientUrl}/login?error=no_user`);
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map