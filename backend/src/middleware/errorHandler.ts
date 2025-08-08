import { Request, Response, NextFunction } from 'express';
import { serverErrorResponse } from '../utils/response.js';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 全局错误处理中间件
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorDetails: string | undefined;

  // 如果是自定义错误
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // 如果是Supabase错误
  else if (error.message.includes('duplicate key value')) {
    statusCode = 409;
    message = 'Resource already exists';
  }
  // 如果是JWT错误
  else if (error.message.includes('jwt')) {
    statusCode = 401;
    message = 'Invalid or expired token';
  }
  // 如果是验证错误
  else if (error.message.includes('validation')) {
    statusCode = 422;
    message = 'Validation failed';
  }
  // 其他错误
  else {
    message = error.message || 'Internal server error';
  }

  // 在开发环境中包含错误堆栈
  if (process.env.NODE_ENV === 'development') {
    errorDetails = error.stack;
    console.error('Error:', error);
  }

  // 记录错误日志
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${statusCode} - ${message}`);

  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// 404处理中间件
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// 异步错误捕获包装器
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 验证错误处理
export const handleValidationError = (errors: any[]): AppError => {
  const message = errors.map(err => err.message || err).join(', ');
  return new AppError(`Validation failed: ${message}`, 422);
};

// 数据库错误处理
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === '23505') { // PostgreSQL unique violation
    return new AppError('Resource already exists', 409);
  }
  if (error.code === '23503') { // PostgreSQL foreign key violation
    return new AppError('Referenced resource not found', 400);
  }
  if (error.code === '23502') { // PostgreSQL not null violation
    return new AppError('Required field is missing', 400);
  }
  
  return new AppError('Database operation failed', 500);
};