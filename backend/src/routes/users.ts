import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getTechnicians,
  getUserStats
} from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 用户基本操作
router.get('/', requireAdmin, getUsers);
router.get('/stats', requireAdmin, getUserStats);
router.get('/technicians', requireAdmin, getTechnicians);
router.get('/:id', getUserById);
router.put('/:id', updateUser);

// 管理员专用路由
router.post('/', requireAdmin, createUser);
router.delete('/:id', requireAdmin, deleteUser);
router.put('/:id/reset-password', requireAdmin, resetUserPassword);

export default router;