import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  assignTechnician,
  claimOrder,
  acceptOrder,
  rejectOrder,
  transferOrder,
  updateOrderDetails,
  addOrderLog
} from '../controllers/orderController.js';
import { authenticate, requireAdmin, requireTechnician } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// --- 通用路由 ---
router.get('/', getOrders); // 获取订单列表 (所有角色，但控制器内有逻辑区分)
router.get('/:id', getOrderById); // 获取订单详情 (所有角色)
router.post('/', createOrder); // 用户创建订单

// --- 技师专属路由 ---
// 主动接单
router.post('/:id/claim', requireTechnician, claimOrder);
// 接受指派
router.put('/:id/accept', requireTechnician, acceptOrder);
// 拒绝指派
router.put('/:id/reject', requireTechnician, rejectOrder);
// 转单或放弃订单
router.put('/:id/transfer', requireTechnician, transferOrder);
// 添加维修日志
router.post('/:id/logs', requireTechnician, addOrderLog);
// 更新订单详情 (诊断、价格、状态等)
router.put('/:id/details', requireTechnician, updateOrderDetails);


// --- 管理员专属路由 ---
// 指派技师
router.put('/:id/assign', requireAdmin, assignTechnician);


export default router;
