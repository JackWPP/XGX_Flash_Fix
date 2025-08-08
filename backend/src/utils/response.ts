import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/index.js';

// 成功响应
export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };
  
  return res.status(statusCode).json(response);
};

// 错误响应
export const errorResponse = (
  res: Response,
  message: string,
  error?: string,
  statusCode: number = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error
  };
  
  return res.status(statusCode).json(response);
};

// 分页响应
export const paginatedResponse = <T>(
  res: Response,
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): Response => {
  const totalPages = Math.ceil(total / limit);
  
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
  
  return res.status(statusCode).json(response);
};

// 未授权响应
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return errorResponse(res, message, 'Authentication required', 401);
};

// 禁止访问响应
export const forbiddenResponse = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return errorResponse(res, message, 'Insufficient permissions', 403);
};

// 未找到响应
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, message, 'The requested resource was not found', 404);
};

// 服务器错误响应
export const serverErrorResponse = (
  res: Response,
  message: string = 'Internal server error',
  error?: string
): Response => {
  return errorResponse(res, message, error, 500);
};

// 验证错误响应
export const validationErrorResponse = (
  res: Response,
  message: string = 'Validation failed',
  errors?: string[]
): Response => {
  return errorResponse(res, message, errors?.join(', '), 422);
};

// 冲突响应
export const conflictResponse = (
  res: Response,
  message: string = 'Resource conflict'
): Response => {
  return errorResponse(res, message, 'The resource already exists or conflicts with existing data', 409);
};