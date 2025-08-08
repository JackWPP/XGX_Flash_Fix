import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignTechnician,
  getOrderStats
} from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 订单基本操作
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats', requireAdmin, getOrderStats);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

// 管理员专用路由
router.put('/:id/assign', requireAdmin, assignTechnician);

export default router;