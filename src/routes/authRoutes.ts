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
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed` }),
  (req, res) => {
    if (req.user) {
      const token = generateToken(req.user._id.toString());
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login-success?token=${token}`);
    } else {
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=no_user`);
    }
  }
);

export default router;
