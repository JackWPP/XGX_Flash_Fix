import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../utils/database.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { LoginRequest, LoginResponse, User, UserRole } from '../types/index.js';

// 用户登录
export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('Login attempt received:', req.body);
  const { phone, password, role }: LoginRequest = req.body;

  // 验证必填字段（管理员登录可不传 role）
  if (!phone || !password) {
    throw new AppError('Phone and password are required', 400);
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError('Invalid phone number format', 400);
  }

  // 如果提供了角色则校验
  if (role && !Object.values(UserRole).includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  // 查询用户：若指定 role 则按 role + phone；否则仅按 phone 查找
  let user: any | null = null;

  if (role) {
    user = await queryOne('SELECT * FROM users WHERE phone = ? AND role = ?', [phone, role]);
  } else {
    const users = await query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 1) {
      user = users[0];
    } else if (users.length > 1) {
      throw new AppError('Multiple roles found for this phone, please specify role', 409);
    }
  }
  console.log('User found in DB:', user ? { id: user.id, name: user.name, role: user.role } : null);

  if (!user) {
    console.error('Login Error: User not found for phone:', phone, 'and role:', role);
    throw new AppError('Invalid credentials', 401);
  }

  // 验证密码
  console.log(`Comparing password for user ${user.id}...`);
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  console.log(`Password validation result for user ${user.id}:`, isPasswordValid);

  if (!isPasswordValid) {
    console.error(`Login Error: Invalid password for user ${user.id}`);
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
  const existingUser = await queryOne('SELECT id FROM users WHERE phone = ?', [phone]);

  if (existingUser) {
    throw new AppError('User with this phone number already exists', 409);
  }

  // 加密密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 创建用户
  const userId = globalThis.crypto.randomUUID();
  await query(
    'INSERT INTO users (id, name, phone, email, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, name, phone, email, role, passwordHash]
  );

  const newUser = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);

  if (!newUser) {
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
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);

  if (!user) {
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
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (name) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }
  if (email) {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }
    updateFields.push('email = ?');
    updateValues.push(email);
  }
  if (avatar) {
    updateFields.push('avatar = ?');
    updateValues.push(avatar);
  }

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  updateFields.push('updated_at = NOW()');
  updateValues.push(req.user.userId);

  // 更新用户信息
  await query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  const updatedUser = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.userId]);

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
  const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.userId]);

  if (!user) {
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
  await query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [newPasswordHash, req.user.userId]
  );

  successResponse(res, 'Password changed successfully');
});