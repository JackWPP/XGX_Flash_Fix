import { Request, Response } from 'express';
import { query, queryOne, transaction } from '../utils/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { Order, OrderStatus, CreateOrderRequest, UpdateOrderStatusRequest, UserRole } from '../types/index.js';

// 创建订单 (逻辑不变)
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);

  const {
    serviceId,
    deviceType,
    deviceModel,
    issueDescription,
    urgencyLevel = 'normal',
    preferredTime,
    contactPhone,
    contactAddress
  }: CreateOrderRequest = req.body;

  if (!serviceId || !deviceType || !issueDescription || !contactPhone) {
    throw new AppError('Missing required fields', 400);
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('base_price')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) throw new AppError('Service not found or inactive', 404);

  const orderNumber = `XGX${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

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
      contact_phone: contactPhone,
      contact_address: contactAddress || '待确认',
      status: OrderStatus.PENDING,
      estimated_price: service.base_price
    })
    .select('*, services:service_id(*), users:user_id(id, name, phone)')
    .single();

  if (error) throw new AppError('Failed to create order', 500, error);

  await supabase.from('order_logs').insert({
    order_id: newOrder.id,
    action: 'create',
    notes: '订单已创建',
    operator_id: req.user.userId
  });

  successResponse(res, 'Order created successfully', newOrder, 201);
});

// 获取订单列表 (增强)
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);

  const { page = 1, limit = 10, status, search, view } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('orders')
    .select('*, services:service_id(id, name), users:user_id(id, name), technicians:technician_id(id, name)', { count: 'exact' });

  // 根据视图参数调整查询逻辑
  if (view === 'unclaimed') {
    // 接单大厅视图
    query = query.eq('status', OrderStatus.PENDING);
  } else if (req.user.role === UserRole.TECHNICIAN) {
    if (status === OrderStatus.PENDING_ACCEPTANCE) {
      query = query.eq('technician_id', req.user.userId).eq('status', OrderStatus.PENDING_ACCEPTANCE);
    } else {
      query = query.eq('technician_id', req.user.userId);
      if(status) query = query.eq('status', status as string);
    }
  } else if (req.user.role === UserRole.USER) {
    query = query.eq('user_id', req.user.userId);
    if(status) query = query.eq('status', status as string);
  } else { // ADMIN or FINANCE
    if(status) query = query.eq('status', status as string);
  }

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,device_model.ilike.%${search}%`);
  }

  const { data: orders, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) throw new AppError('Failed to fetch orders', 500, error);

  paginatedResponse(res, 'Orders retrieved successfully', orders || [], {
    page: Number(page),
    limit: Number(limit),
    total: count || 0,
    totalPages: Math.ceil((count || 0) / Number(limit))
  });
});

// 获取订单详情 (逻辑不变)
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, services:service_id(*), users:user_id(*), technicians:technician_id(*), order_logs(*), payments(*), reviews(*)')
        .eq('id', id)
        .single();

    if (error || !order) throw new AppError('Order not found', 404);
    successResponse(res, 'Order retrieved successfully', order);
});

// [重构] 指派技师
export const assignTechnician = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;
  const { technicianId } = req.body;

  if (!technicianId) throw new AppError('Technician ID is required', 400);

  const { data: technician } = await supabase.from('users').select('id, name').eq('id', technicianId).eq('role', UserRole.TECHNICIAN).single();
  if (!technician) throw new AppError('Technician not found', 404);

  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({ technician_id: technicianId, status: OrderStatus.PENDING_ACCEPTANCE })
    .eq('id', id)
    .in('status', [OrderStatus.PENDING, OrderStatus.PENDING_ACCEPTANCE]) // 允许从待处理或已指派（可转单）更新
    .select('*, technicians:technician_id(id, name)')
    .single();

  if (error || !updatedOrder) throw new AppError('Failed to assign technician', 500, error);

  await supabase.from('order_logs').insert({
    order_id: id,
    action: 'assign',
    notes: `订单已指派给技师 ${technician.name}，等待接收`,
    operator_id: req.user.userId
  });

  successResponse(res, 'Technician assigned successfully', updatedOrder);
});

// [新增] 技师主动接单
export const claimOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ technician_id: req.user.userId, status: OrderStatus.IN_PROGRESS })
        .eq('id', id)
        .eq('status', OrderStatus.PENDING)
        .select('*, technicians:technician_id(id, name)')
        .single();

    if (error || !updatedOrder) throw new AppError('Failed to claim order. It might be already taken.', 409, error);

    await supabase.from('order_logs').insert({
        order_id: id,
        action: 'claim',
        notes: '技师已接单',
        operator_id: req.user.userId
    });

    successResponse(res, 'Order claimed successfully', updatedOrder);
});

// [新增] 技师接受指派
export const acceptOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ status: OrderStatus.IN_PROGRESS })
        .eq('id', id)
        .eq('technician_id', req.user.userId)
        .eq('status', OrderStatus.PENDING_ACCEPTANCE)
        .select()
        .single();

    if (error || !updatedOrder) throw new AppError('Failed to accept order.', 400, error);

    await supabase.from('order_logs').insert({
        order_id: id,
        action: 'accept',
        notes: '技师已接受指派',
        operator_id: req.user.userId
    });

    successResponse(res, 'Order accepted', updatedOrder);
});

// [新增] 技师拒绝指派
export const rejectOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ technician_id: null, status: OrderStatus.PENDING })
        .eq('id', id)
        .eq('technician_id', req.user.userId)
        .eq('status', OrderStatus.PENDING_ACCEPTANCE)
        .select()
        .single();

    if (error || !updatedOrder) throw new AppError('Failed to reject order.', 400, error);

    await supabase.from('order_logs').insert({
        order_id: id,
        action: 'reject',
        notes: '技师已拒绝指派，订单返回待处理状态',
        operator_id: req.user.userId
    });

    successResponse(res, 'Order rejected', updatedOrder);
});

// [新增] 技师转单
export const transferOrder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;
    const { newTechnicianId } = req.body;

    // 如果没有提供新的技师ID，则为放弃订单
    if (!newTechnicianId) {
        const { data, error } = await supabase
            .from('orders')
            .update({ technician_id: null, status: OrderStatus.PENDING })
            .eq('id', id)
            .eq('technician_id', req.user.userId)
            .select().single();
        if (error || !data) throw new AppError('Failed to abandon order', 400, error);
        await supabase.from('order_logs').insert({ order_id: id, action: 'abandon', notes: '技师放弃订单，返回待处理', operator_id: req.user.userId });
        return successResponse(res, 'Order abandoned successfully', data);
    }

    // 转单给其他技师
    const { data: technician } = await supabase.from('users').select('id, name').eq('id', newTechnicianId).eq('role', UserRole.TECHNICIAN).single();
    if (!technician) throw new AppError('Target technician not found', 404);

    const { data, error } = await supabase
        .from('orders')
        .update({ technician_id: newTechnicianId, status: OrderStatus.PENDING_ACCEPTANCE })
        .eq('id', id)
        .eq('technician_id', req.user.userId)
        .select().single();

    if (error || !data) throw new AppError('Failed to transfer order', 400, error);
    await supabase.from('order_logs').insert({ order_id: id, action: 'transfer', notes: `订单已转派给技师 ${technician.name}`, operator_id: req.user.userId });
    successResponse(res, 'Order transferred successfully', data);
});

// [新增] 更新订单详情 (诊断, 价格)
export const updateOrderDetails = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;
    const { diagnosis, actual_price, status } = req.body;

    const updateData: any = {};
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (actual_price) updateData.actual_price = actual_price;
    if (status) updateData.status = status; // 允许同时更新状态，如完成

    const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select().single();

    if (error || !data) throw new AppError('Failed to update order details', 400, error);
    await supabase.from('order_logs').insert({ order_id: id, action: 'update_details', notes: '订单详情已更新', operator_id: req.user.userId });
    successResponse(res, 'Order details updated', data);
});

// [新增] 添加维修日志
export const addOrderLog = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('User not authenticated', 401);
    const { id } = req.params;
    const { notes, images } = req.body;

    if (!notes || notes.trim().length < 1) throw new AppError('Log notes cannot be empty', 400);

    const { data, error } = await supabase
        .from('order_logs')
        .insert({
            order_id: id,
            action: 'log',
            notes,
            images: images || [],
            operator_id: req.user.userId
        }).select().single();

    if (error || !data) throw new AppError('Failed to add order log', 400, error);
    successResponse(res, 'Log added successfully', data, 201);
});
