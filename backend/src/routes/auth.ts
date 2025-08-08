import { Router } from 'express';
import {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 公开路由
router.post('/login', login);
router.post('/register', register);

// 需要认证的路由
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;