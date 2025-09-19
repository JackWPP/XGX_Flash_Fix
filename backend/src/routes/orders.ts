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
  updateOrderStatus,
  updateOrderDetails,
  addOrderLog
} from '../controllers/orderController.js';
import { authenticate, requireAdmin, requireTechnician } from '../middleware/auth.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// --- Common routes ---
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);

// --- Technician routes ---
router.post('/:id/claim', requireTechnician, claimOrder);
router.put('/:id/accept', requireTechnician, acceptOrder);
router.put('/:id/reject', requireTechnician, rejectOrder);
router.put('/:id/transfer', requireTechnician, transferOrder);
router.post('/:id/logs', requireTechnician, addOrderLog);
router.put('/:id/details', requireTechnician, updateOrderDetails);

// --- Admin routes ---
router.put('/:id/assign', requireAdmin, assignTechnician);

export default router;

