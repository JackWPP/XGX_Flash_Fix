import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../utils/database.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { User, UserRole } from '../types/index.js';

// 获取用户列表（仅管理员）
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const {
    page = 1,
    limit = 20,
    role,
    search
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('users')
    .select('id, name, phone, email, role, avatar, created_at, updated_at', { count: 'exact' });

  // 应用过滤条件
  if (role) {
    query = query.eq('role', role);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // 排序和分页
  const { data: users, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    console.error('Users query error:', error);
    throw new AppError('Failed to fetch users', 500);
  }

  paginatedResponse(res, 'Users retrieved successfully', users || [], {
    page: Number(page),
    limit: Number(limit),
    total: count || 0,
    totalPages: Math.ceil((count || 0) / Number(limit))
  });
});

// 获取用户详情
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;

  // 检查权限：用户只能查看自己的信息，管理员可以查看所有用户
  if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
    throw new AppError('Access denied', 403);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, phone, email, role, avatar, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    throw new AppError('User not found', 404);
  }

  successResponse(res, 'User retrieved successfully', user);
});

// 创建用户（仅管理员）
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { name, phone, email, password, role = UserRole.USER } = req.body;

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

  // 验证角色
  if (!Object.values(UserRole).includes(role)) {
    throw new AppError('Invalid role', 400);
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
    .select('id, name, phone, email, role, avatar, created_at, updated_at')
    .single();

  if (error) {
    console.error('User creation error:', error);
    throw new AppError('Failed to create user', 500);
  }

  successResponse(res, 'User created successfully', newUser, 201);
});

// 更新用户信息
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;
  const { name, email, role, avatar } = req.body;

  // 检查权限：用户只能更新自己的信息（除了角色），管理员可以更新所有用户
  if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
    throw new AppError('Access denied', 403);
  }

  // 非管理员不能修改角色
  if (req.user.role !== UserRole.ADMIN && role !== undefined) {
    throw new AppError('Only administrators can change user roles', 403);
  }

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

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
  if (role && req.user.role === UserRole.ADMIN) {
    if (!Object.values(UserRole).includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    updateData.role = role;
  }

  if (Object.keys(updateData).length === 1) { // 只有updated_at
    throw new AppError('No valid fields to update', 400);
  }

  // 更新用户信息
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, name, phone, email, role, avatar, created_at, updated_at')
    .single();

  if (error) {
    console.error('User update error:', error);
    throw new AppError('Failed to update user', 500);
  }

  if (!updatedUser) {
    throw new AppError('User not found', 404);
  }

  successResponse(res, 'User updated successfully', updatedUser);
});

// 删除用户（仅管理员）
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { id } = req.params;

  // 不能删除自己
  if (req.user.userId === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // 检查是否有关联的订单
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .or(`user_id.eq.${id},technician_id.eq.${id}`)
    .limit(1);

  if (orderError) {
    console.error('Order check error:', orderError);
    throw new AppError('Failed to check user dependencies', 500);
  }

  if (orders && orders.length > 0) {
    throw new AppError('Cannot delete user with existing orders', 400);
  }

  // 删除用户
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('User deletion error:', error);
    throw new AppError('Failed to delete user', 500);
  }

  successResponse(res, 'User deleted successfully');
});

// 重置用户密码（仅管理员）
export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new AppError('New password is required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // 加密新密码
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // 更新密码
  const { error } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Password reset error:', error);
    throw new AppError('Failed to reset password', 500);
  }

  successResponse(res, 'Password reset successfully');
});

// 获取技术员列表
export const getTechnicians = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // 只有管理员可以查看技术员列表
  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { data: technicians, error } = await supabase
    .from('users')
    .select('id, name, phone, email, avatar, created_at')
    .eq('role', UserRole.TECHNICIAN)
    .order('name');

  if (error) {
    console.error('Technicians query error:', error);
    throw new AppError('Failed to fetch technicians', 500);
  }

  successResponse(res, 'Technicians retrieved successfully', technicians || []);
});

// 获取用户统计（仅管理员）
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('role, created_at');

  if (error) {
    console.error('User stats query error:', error);
    throw new AppError('Failed to fetch user statistics', 500);
  }

  // 计算统计数据
  const stats = {
    total: users?.length || 0,
    users: users?.filter(u => u.role === UserRole.USER).length || 0,
    technicians: users?.filter(u => u.role === UserRole.TECHNICIAN).length || 0,
    admins: users?.filter(u => u.role === UserRole.ADMIN).length || 0,
    finance: users?.filter(u => u.role === UserRole.FINANCE).length || 0,
    newUsersThisMonth: 0
  };

  // 计算本月新用户数
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  stats.newUsersThisMonth = users?.filter(u => {
    const createdDate = new Date(u.created_at);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length || 0;

  successResponse(res, 'User statistics retrieved successfully', stats);
});