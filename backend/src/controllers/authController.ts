import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/database.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { LoginRequest, LoginResponse, User, UserRole } from '../types/index.js';

// 用户登录
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, role }: LoginRequest = req.body;

  // 验证必填字段
  if (!phone || !password || !role) {
    throw new AppError('Phone, password, and role are required', 400);
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError('Invalid phone number format', 400);
  }

  // 验证角色
  if (!Object.values(UserRole).includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  // 查询用户
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .eq('role', role)
    .single();

  if (error || !user) {
    throw new AppError('Invalid credentials', 401);
  }

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // 生成JWT令牌
  const token = generateToken(user.id, user.role);

  // 构造响应数据（不包含密码）
  const userData: User = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };

  const responseData: LoginResponse = {
    user: userData,
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };

  successResponse(res, 'Login successful', responseData);
});

// 用户注册
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, password, email, role = UserRole.USER } = req.body;

  // 验证必填字段
  if (!name || !phone || !password) {
    throw new AppError('Name, phone, and password are required', 400);
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError('Invalid phone number format', 400);
  }

  // 验证密码强度
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // 验证邮箱格式（如果提供）
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }
  }

  // 检查用户是否已存在
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existingUser) {
    throw new AppError('User with this phone number already exists', 409);
  }

  // 加密密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      name,
      phone,
      email,
      role,
      password_hash: passwordHash
    })
    .select()
    .single();

  if (error) {
    console.error('User creation error:', error);
    throw new AppError('Failed to create user', 500);
  }

  // 生成JWT令牌
  const token = generateToken(newUser.id, newUser.role);

  // 构造响应数据（不包含密码）
  const userData: User = {
    id: newUser.id,
    name: newUser.name,
    phone: newUser.phone,
    email: newUser.email,
    role: newUser.role,
    avatar: newUser.avatar,
    createdAt: newUser.created_at,
    updatedAt: newUser.updated_at
  };

  const responseData: LoginResponse = {
    user: userData,
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };

  successResponse(res, 'User registered successfully', responseData, 201);
});

// 获取当前用户信息
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // 查询用户详细信息
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single();

  if (error || !user) {
    throw new AppError('User not found', 404);
  }

  // 构造响应数据（不包含密码）
  const userData: User = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };

  successResponse(res, 'User information retrieved successfully', userData);
});

// 更新用户信息
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { name, email, avatar } = req.body;
  const updateData: any = {};

  if (name) updateData.name = name;
  if (email) {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }
    updateData.email = email;
  }
  if (avatar) updateData.avatar = avatar;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updateData.updated_at = new Date().toISOString();

  // 更新用户信息
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', req.user.userId)
    .select()
    .single();

  if (error) {
    console.error('User update error:', error);
    throw new AppError('Failed to update user information', 500);
  }

  // 构造响应数据（不包含密码）
  const userData: User = {
    id: updatedUser.id,
    name: updatedUser.name,
    phone: updatedUser.phone,
    email: updatedUser.email,
    role: updatedUser.role,
    avatar: updatedUser.avatar,
    createdAt: updatedUser.created_at,
    updatedAt: updatedUser.updated_at
  };

  successResponse(res, 'User information updated successfully', userData);
});

// 修改密码
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  // 查询用户当前密码
  const { data: user, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.userId)
    .single();

  if (error || !user) {
    throw new AppError('User not found', 404);
  }

  // 验证当前密码
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // 加密新密码
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // 更新密码
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.userId);

  if (updateError) {
    console.error('Password update error:', updateError);
    throw new AppError('Failed to update password', 500);
  }

  successResponse(res, 'Password changed successfully');
});