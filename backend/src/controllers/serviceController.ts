import { Request, Response } from 'express';
import { supabase } from '../utils/database.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

// 获取服务列表
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    category,
    isActive,
    search
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('services')
    .select('*', { count: 'exact' });

  // 应用过滤条件
  if (category) {
    query = query.eq('category', category);
  }
  if (isActive !== undefined) {
    query = query.eq('is_active', isActive === 'true');
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 排序和分页
  const { data: services, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    console.error('Services query error:', error);
    throw new AppError('Failed to fetch services', 500);
  }

  paginatedResponse(res, 'Services retrieved successfully', services || [], {
    page: Number(page),
    limit: Number(limit),
    total: count || 0,
    totalPages: Math.ceil((count || 0) / Number(limit))
  });
});

// 获取服务详情
export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !service) {
    throw new AppError('Service not found', 404);
  }

  successResponse(res, 'Service retrieved successfully', service);
});

// 创建服务（仅管理员）
export const createService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const {
    name,
    description,
    category,
    base_price,
    estimated_duration,
    is_active = true
  } = req.body;

  // 验证必填字段
  if (!name || !description || !category || base_price === undefined || base_price === null) {
    throw new AppError('Name, description, category, and base price are required', 400);
  }

  if (base_price < 0) {
    throw new AppError('Base price must be non-negative', 400);
  }

  // 创建服务
  const { data: newService, error } = await supabase
    .from('services')
    .insert({
      name,
      description,
      category,
      base_price,
      estimated_duration,
      is_active
    })
    .select()
    .single();

  if (error) {
    console.error('Service creation error:', error);
    throw new AppError('Failed to create service', 500);
  }

  successResponse(res, 'Service created successfully', newService, 201);
});

// 更新服务（仅管理员）
export const updateService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { id } = req.params;
  const {
    name,
    description,
    category,
    base_price,
    estimated_duration,
    is_active
  } = req.body;

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (base_price !== undefined) {
    if (base_price < 0) {
      throw new AppError('Base price must be non-negative', 400);
    }
    updateData.base_price = base_price;
  }
  if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration;
  if (is_active !== undefined) updateData.is_active = is_active;

  // 更新服务
  const { data: updatedService, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Service update error:', error);
    throw new AppError('Failed to update service', 500);
  }

  if (!updatedService) {
    throw new AppError('Service not found', 404);
  }

  successResponse(res, 'Service updated successfully', updatedService);
});

// 删除服务（仅管理员）
export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { id } = req.params;

  // 检查是否有关联的订单
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('service_id', id)
    .limit(1);

  if (orderError) {
    console.error('Order check error:', orderError);
    throw new AppError('Failed to check service dependencies', 500);
  }

  if (orders && orders.length > 0) {
    throw new AppError('Cannot delete service with existing orders', 400);
  }

  // 删除服务
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Service deletion error:', error);
    throw new AppError('Failed to delete service', 500);
  }

  successResponse(res, 'Service deleted successfully');
});

// 获取服务分类列表
export const getServiceCategories = asyncHandler(async (req: Request, res: Response) => {
  const { data: categories, error } = await supabase
    .from('services')
    .select('category')
    .eq('is_active', true);

  if (error) {
    console.error('Categories query error:', error);
    throw new AppError('Failed to fetch service categories', 500);
  }

  // 去重并排序
  const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])].sort();

  successResponse(res, 'Service categories retrieved successfully', uniqueCategories);
});

// 获取热门服务
export const getPopularServices = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  // 查询订单数量最多的服务
  const { data: popularServices, error } = await supabase
    .from('services')
    .select(`
      *,
      orders!inner(service_id)
    `)
    .eq('is_active', true)
    .limit(Number(limit));

  if (error) {
    console.error('Popular services query error:', error);
    throw new AppError('Failed to fetch popular services', 500);
  }

  // 计算每个服务的订单数量并排序
  const servicesWithCount = popularServices?.map(service => ({
    ...service,
    orderCount: service.orders?.length || 0
  })).sort((a, b) => b.orderCount - a.orderCount) || [];

  // 移除orders字段，只保留orderCount
  const result = servicesWithCount.map(({ orders, ...service }) => service);

  successResponse(res, 'Popular services retrieved successfully', result);
});