import { Router } from 'express';
import authRoutes from './auth.js';
import orderRoutes from './orders.js';
import serviceRoutes from './services.js';
import userRoutes from './users.js';

const router = Router();

// API版本前缀
const API_VERSION = '/api/v1';

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'XGX Flash Fix API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 路由注册
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/orders`, orderRoutes);
router.use(`${API_VERSION}/services`, serviceRoutes);
router.use(`${API_VERSION}/users`, userRoutes);

export default router;