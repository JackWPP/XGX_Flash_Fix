import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.js';
import { UserRole } from '../types/index.js';

// 认证中间件
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      unauthorizedResponse(res, 'Access token is required');
      return;
    }
    
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    unauthorizedResponse(res, 'Invalid or expired token');
  }
};

// 角色授权中间件
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, 'Authentication required');
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      forbiddenResponse(res, 'Insufficient permissions for this operation');
      return;
    }
    
    next();
  };
};

// 可选认证中间件（不强制要求认证）
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next();
  }
};

// 检查是否为订单所有者或管理员
export const checkOrderOwnership = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    unauthorizedResponse(res, 'Authentication required');
    return;
  }
  
  // 管理员和客服可以访问所有订单
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SERVICE) {
    next();
    return;
  }
  
  // 技术员可以访问分配给他们的订单
  if (req.user.role === UserRole.TECHNICIAN) {
    // 这里需要在具体的控制器中进一步验证
    next();
    return;
  }
  
  // 普通用户只能访问自己的订单
  if (req.user.role === UserRole.USER) {
    // 这里需要在具体的控制器中进一步验证
    next();
    return;
  }
  
  forbiddenResponse(res, 'Access denied');
};

// 检查是否为技术员或管理员
export const requireTechnicianOrAdmin = authorize(UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SERVICE);

// 检查是否为管理员
export const requireAdmin = authorize(UserRole.ADMIN);

// 检查是否为财务人员或管理员
export const requireFinanceOrAdmin = authorize(UserRole.FINANCE, UserRole.ADMIN);

// 检查是否为技术员
export const requireTechnician = authorize(UserRole.TECHNICIAN);