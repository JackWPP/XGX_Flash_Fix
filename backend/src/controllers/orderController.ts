import { Request, Response } from 'express';
import { supabase } from '../utils/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { Order, OrderStatus, CreateOrderRequest, UpdateOrderStatusRequest, UserRole } from '../types/index.js';

// 创建订单
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const {
    serviceId,
    deviceType,
    deviceModel,
    issueDescription,
    urgencyLevel = 'normal',
    preferredTime,
    contactAddress,
    contactPhone
  }: CreateOrderRequest = req.body;

  // 验证必填字段
  if (!serviceId || !deviceType || !deviceModel || !issueDescription || !contactAddress || !contactPhone) {
    throw new AppError('Missing required fields', 400);
  }

  // 验证服务是否存在
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    throw new AppError('Service not found or inactive', 404);
  }

  // 生成订单号
  const orderNumber = `XGX${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // 创建订单
  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: req.user.userId,
      service_id: serviceId,
      device_type: deviceType,
      device_model: deviceModel,
      issue_description: issueDescription,
      urgency_level: urgencyLevel,
      preferred_time: preferredTime,
      contact_address: contactAddress,
      contact_phone: contactPhone,
      status: OrderStatus.PENDING,
      estimated_price: service.base_price
    })
    .select(`
      *,
      services:service_id(*),
      users:user_id(id, name, phone)
    `)
    .single();

  if (error) {
    console.error('Order creation error:', error);
    throw new AppError('Failed to create order', 500);
  }

  // 记录订单日志
  await supabase
    .from('order_logs')
    .insert({
      order_id: newOrder.id,
      status: OrderStatus.PENDING,
      notes: 'Order created',
      created_by: req.user.userId
    });

  successResponse(res, 'Order created successfully', newOrder, 201);
});

// 获取订单列表
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const {
    page = 1,
    limit = 10,
    status,
    urgencyLevel,
    startDate,
    endDate,
    search
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('orders')
    .select(`
      *,
      services:service_id(id, name, category, base_price),
      users:user_id(id, name, phone),
      technicians:technician_id(id, name, phone)
    `, { count: 'exact' });

  // 根据用户角色过滤订单
  if (req.user.role === UserRole.USER) {
    query = query.eq('user_id', req.user.userId);
  } else if (req.user.role === UserRole.TECHNICIAN) {
    query = query.eq('technician_id', req.user.userId);
  }
  // 管理员和财务可以查看所有订单

  // 应用过滤条件
  if (status) {
    query = query.eq('status', status);
  }
  if (urgencyLevel) {
    query = query.eq('urgency_level', urgencyLevel);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,device_type.ilike.%${search}%,device_model.ilike.%${search}%`);
  }

  // 排序和分页
  const { data: orders, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) {
    console.error('Orders query error:', error);
    throw new AppError('Failed to fetch orders', 500);
  }

  paginatedResponse(res, 'Orders retrieved successfully', orders || [], {
    page: Number(page),
    limit: Number(limit),
    total: count || 0,
    totalPages: Math.ceil((count || 0) / Number(limit))
  });
});

// 获取订单详情
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      services:service_id(*),
      users:user_id(id, name, phone, email),
      technicians:technician_id(id, name, phone, email),
      order_logs(*),
      payments(*),
      reviews(*)
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    throw new AppError('Order not found', 404);
  }

  // 检查权限
  if (req.user.role === UserRole.USER && order.user_id !== req.user.userId) {
    throw new AppError('Access denied', 403);
  }
  if (req.user.role === UserRole.TECHNICIAN && order.technician_id !== req.user.userId) {
    throw new AppError('Access denied', 403);
  }

  successResponse(res, 'Order retrieved successfully', order);
});

// 更新订单状态
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;
  const { status, notes, estimatedPrice, actualPrice }: UpdateOrderStatusRequest = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  if (!Object.values(OrderStatus).includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // 查询订单
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (orderError || !order) {
    throw new AppError('Order not found', 404);
  }

  // 检查权限
  if (req.user.role === UserRole.USER) {
    // 用户只能取消自己的订单
    if (order.user_id !== req.user.userId || status !== OrderStatus.CANCELLED) {
      throw new AppError('Access denied', 403);
    }
  } else if (req.user.role === UserRole.TECHNICIAN) {
    // 技术员只能更新分配给自己的订单
    if (order.technician_id !== req.user.userId) {
      throw new AppError('Access denied', 403);
    }
  }
  // 管理员和财务可以更新任何订单

  // 构建更新数据
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (estimatedPrice !== undefined) {
    updateData.estimated_price = estimatedPrice;
  }
  if (actualPrice !== undefined) {
    updateData.actual_price = actualPrice;
  }

  // 更新订单
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      services:service_id(*),
      users:user_id(id, name, phone),
      technicians:technician_id(id, name, phone)
    `)
    .single();

  if (error) {
    console.error('Order update error:', error);
    throw new AppError('Failed to update order', 500);
  }

  // 记录订单日志
  await supabase
    .from('order_logs')
    .insert({
      order_id: id,
      status,
      notes: notes || `Status updated to ${status}`,
      created_by: req.user.userId
    });

  successResponse(res, 'Order status updated successfully', updatedOrder);
});

// 分配技术员
export const assignTechnician = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // 只有管理员可以分配技术员
  if (req.user.role !== UserRole.ADMIN) {
    throw new AppError('Access denied', 403);
  }

  const { id } = req.params;
  const { technicianId } = req.body;

  if (!technicianId) {
    throw new AppError('Technician ID is required', 400);
  }

  // 验证技术员是否存在
  const { data: technician, error: techError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', technicianId)
    .eq('role', UserRole.TECHNICIAN)
    .single();

  if (techError || !technician) {
    throw new AppError('Technician not found', 404);
  }

  // 更新订单
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({
      technician_id: technicianId,
      status: OrderStatus.ASSIGNED,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      services:service_id(*),
      users:user_id(id, name, phone),
      technicians:technician_id(id, name, phone)
    `)
    .single();

  if (error) {
    console.error('Technician assignment error:', error);
    throw new AppError('Failed to assign technician', 500);
  }

  // 记录订单日志
  await supabase
    .from('order_logs')
    .insert({
      order_id: id,
      status: OrderStatus.ASSIGNED,
      notes: `Assigned to technician: ${technician.name}`,
      created_by: req.user.userId
    });

  successResponse(res, 'Technician assigned successfully', updatedOrder);
});

// 获取订单统计
export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // 只有管理员和财务可以查看统计
  if (![UserRole.ADMIN, UserRole.FINANCE].includes(req.user.role)) {
    throw new AppError('Access denied', 403);
  }

  const { startDate, endDate } = req.query;

  let query = supabase
    .from('orders')
    .select('status, actual_price, created_at');

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error('Order stats query error:', error);
    throw new AppError('Failed to fetch order statistics', 500);
  }

  // 计算统计数据
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === OrderStatus.PENDING).length || 0,
    assigned: orders?.filter(o => o.status === OrderStatus.ASSIGNED).length || 0,
    inProgress: orders?.filter(o => o.status === OrderStatus.IN_PROGRESS).length || 0,
    completed: orders?.filter(o => o.status === OrderStatus.COMPLETED).length || 0,
    cancelled: orders?.filter(o => o.status === OrderStatus.CANCELLED).length || 0,
    totalRevenue: orders?.reduce((sum, o) => sum + (o.actual_price || 0), 0) || 0,
    averageOrderValue: 0
  };

  if (stats.completed > 0) {
    const completedOrders = orders?.filter(o => o.status === OrderStatus.COMPLETED && o.actual_price) || [];
    stats.averageOrderValue = completedOrders.reduce((sum, o) => sum + o.actual_price, 0) / completedOrders.length;
  }

  successResponse(res, 'Order statistics retrieved successfully', stats);
});