import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  getPopularServices
} from '../controllers/serviceController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// 公开路由
router.get('/', getServices);
router.get('/categories', getServiceCategories);
router.get('/popular', getPopularServices);
router.get('/:id', getServiceById);

// 管理员专用路由
router.post('/', authenticate, requireAdmin, createService);
router.put('/:id', authenticate, requireAdmin, updateService);
router.delete('/:id', authenticate, requireAdmin, deleteService);

export default router;