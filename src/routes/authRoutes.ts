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
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '');
    console.log(`[Google OAuth Callback] Route triggered. CLIENT_URL config: ${process.env.CLIENT_URL}, Normalized clientUrl: ${clientUrl}`);
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: `${(process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '')}/login?error=oauth_failed` 
  }),
  (req, res) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '');
    
    if (req.user) {
      const token = generateToken(req.user._id.toString());
      console.log(`[Google OAuth Callback] Success: Generated JWT token: ${token}`);
      const redirectUrl = `${clientUrl}/login-success?token=${token}`;
      console.log(`[Google OAuth Callback] Redirecting user to: ${redirectUrl}`);
      res.redirect(redirectUrl);
    } else {
      console.error('[Google OAuth Callback] Failure: No req.user found.');
      const redirectUrl = `${clientUrl}/login?error=no_user`;
      console.log(`[Google OAuth Callback] Redirecting user to: ${redirectUrl}`);
      res.redirect(redirectUrl);
    }
  }
);

export default router;
