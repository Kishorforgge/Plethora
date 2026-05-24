import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

export default router;
