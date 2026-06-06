import { Router } from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware';
import { protect } from '../middleware/authMiddleware';
import { generateToken } from '../utils/generateToken';

const router = Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

// Google OAuth login route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get(
  '/google/callback',
  (req, res, next) => {
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const clientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;

    passport.authenticate('google', {
      failureRedirect: `${clientUrl}/login?error=oauth_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const clientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;

    if (req.user) {
      const token = generateToken(req.user._id.toString());

      console.log("================ Google OAuth Callback Success ================");
      console.log("CLIENT_URL (raw) =", process.env.CLIENT_URL);
      console.log("CLIENT_URL (normalized) =", clientUrl);
      console.log("GOOGLE_CALLBACK_URL =", process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback');
      console.log("Generated JWT Token =", token);
      console.log("Redirect URL =", `${clientUrl}/login-success?token=${token}`);
      console.log("===============================================================");

      res.redirect(`${clientUrl}/login-success?token=${token}`);
    } else {
      console.log("================ Google OAuth Callback Failure ================");
      console.log("No user found in session.");
      console.log("Redirecting to /login?error=no_user");
      console.log("===============================================================");
      res.redirect(`${clientUrl}/login?error=no_user`);
    }
  }
);
export default router;
