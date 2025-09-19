import { Request, Response } from 'express';
import { query, queryOne } from '../utils/database.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { OrderStatus, CreateOrderRequest, UpdateOrderStatusRequest, UserRole } from '../types/index.js';

const DEFAULT_CONTACT_ADDRESS = 'Pending confirmation';
const ORDER_NUMBER_PREFIX = 'XGX';

const buildOrderNumber = () => `${ORDER_NUMBER_PREFIX}${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Helpers ---------------------------------------------------------------
const shapeOrderDetails = (row: any, logs: any[] = [], payments: any[] = [], reviews: any[] = []) => {
  if (!row) return null;
  return {
    ...row,
    users: row.user_id
      ? {
          id: row.user_id,
          name: row.user_name,
          phone: row.user_phone,
          email: row.user_email,
          role: row.user_role
        }
      : undefined,
    services: row.service_id
      ? {
          id: row.service_id,
          name: row.service_name,
          category: row.service_category,
          base_price: row.service_base_price
        }
      : undefined,
    technicians: row.technician_id
      ? {
          id: row.technician_id,
          name: row.technician_name,
          phone: row.technician_phone,
          role: row.technician_role
        }
      : undefined,
    order_logs: logs,
    payments,
    reviews
  };
};

// 创建订单 -------------------------------------------------------------
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

  const service = await queryOne(
    'SELECT base_price FROM services WHERE id = ? AND is_active = 1',
    [serviceId]
  );
  if (!service) throw new AppError('Service not found or inactive', 404);

  const orderNumber = buildOrderNumber();

  await query(
    `INSERT INTO orders (
      order_number, user_id, service_id, device_type, device_model,
      issue_description, urgency_level, preferred_time, contact_phone,
      contact_address, status, estimated_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderNumber,
      req.user.userId,
      serviceId,
      deviceType,
      deviceModel || '',
      issueDescription,
      urgencyLevel,
      preferredTime || null,
      contactPhone,
      contactAddress || DEFAULT_CONTACT_ADDRESS,
      OrderStatus.PENDING,
      service.base_price
    ]
  );

  const order = await queryOne(
    `SELECT o.*, s.name AS service_name, u.name AS user_name, u.phone AS user_phone
     FROM orders o
     LEFT JOIN services s ON o.service_id = s.id
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.order_number = ?`,
    [orderNumber]
  );
  if (!order) throw new AppError('Failed to retrieve created order', 500);

  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [order.id, 'create', 'Order created', req.user.userId]
  );

  successResponse(res, 'Order created successfully', order, 201);
});

// 获取订单列表 ---------------------------------------------------------
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);

  const { page = 1, limit = 10, status, search, view } = req.query as any;
  const offset = (Number(page) - 1) * Number(limit);

  const whereConditions: string[] = [];
  const params: any[] = [];

  if (view === 'unclaimed') {
    whereConditions.push('o.status = ?');
    params.push(OrderStatus.PENDING);
  } else if (req.user.role === UserRole.TECHNICIAN) {
    if (status === OrderStatus.PENDING_ACCEPTANCE) {
      whereConditions.push('o.technician_id = ? AND o.status = ?');
      params.push(req.user.userId, OrderStatus.PENDING_ACCEPTANCE);
    } else {
      whereConditions.push('o.technician_id = ?');
      params.push(req.user.userId);
      if (status) {
        whereConditions.push('o.status = ?');
        params.push(String(status));
      }
    }
  } else if (req.user.role === UserRole.USER) {
    whereConditions.push('o.user_id = ?');
    params.push(req.user.userId);
    if (status) {
      whereConditions.push('o.status = ?');
      params.push(String(status));
    }
  } else if (status) {
    whereConditions.push('o.status = ?');
    params.push(String(status));
  }

  if (search) {
    whereConditions.push('(o.order_number LIKE ? OR o.device_model LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const countParams = whereConditions.length ? [...params] : [];
  const listParams = whereConditions.length ? [...params] : [];

  const countResult = await queryOne(
    `SELECT COUNT(*) AS total FROM orders o ${whereClause}`,
    countParams
  );

  const orders = await query(
    `SELECT o.*, 
            s.id AS service_id, s.name AS service_name,
            u.id AS user_id, u.name AS user_name,
            t.id AS technician_id, t.name AS technician_name
     FROM orders o
     LEFT JOIN services s ON o.service_id = s.id
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN users t ON o.technician_id = t.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${offset}`,
    listParams
  );

  paginatedResponse(
    res,
    'Orders retrieved successfully',
    orders || [],
    Number(page),
    Number(limit),
    Number(countResult?.total || 0)
  );
});

// 获取订单详情 ---------------------------------------------------------
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;

  const row = await queryOne(
    `SELECT o.*, 
            s.id AS service_id, s.name AS service_name, s.category AS service_category, s.base_price AS service_base_price,
            u.id AS user_id, u.name AS user_name, u.phone AS user_phone, u.email AS user_email, u.role AS user_role,
            t.id AS technician_id, t.name AS technician_name, t.phone AS technician_phone, t.role AS technician_role
     FROM orders o
     LEFT JOIN services s ON o.service_id = s.id
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN users t ON o.technician_id = t.id
     WHERE o.id = ?`,
    [id]
  );
  if (!row) throw new AppError('Order not found', 404);

  const logs = await query(
    `SELECT ol.*, u.name AS operator_name
     FROM order_logs ol
     LEFT JOIN users u ON ol.operator_id = u.id
     WHERE ol.order_id = ?
     ORDER BY ol.created_at DESC`,
    [id]
  );

  const payments = await query(
    'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
    [id]
  );

  const reviews = await query(
    'SELECT * FROM reviews WHERE order_id = ? ORDER BY created_at DESC',
    [id]
  );

  const order = shapeOrderDetails(row, logs || [], payments || [], reviews || []);
  successResponse(res, 'Order retrieved successfully', order);
});

// 指派技师（管理员） -------------------------------------------------
export const assignTechnician = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;
  const { technicianId } = req.body as { technicianId?: string };

  if (!technicianId) throw new AppError('Technician ID is required', 400);

  const technician = await queryOne(
    'SELECT id, name FROM users WHERE id = ? AND role = ?',
    [technicianId, UserRole.TECHNICIAN]
  );
  if (!technician) throw new AppError('Technician not found', 404);

  const result: any = await query(
    `UPDATE orders
     SET technician_id = ?, status = ?
     WHERE id = ? AND status IN (?, ?)`,
    [technicianId, OrderStatus.PENDING_ACCEPTANCE, id, OrderStatus.PENDING, OrderStatus.PENDING_ACCEPTANCE]
  );

  if (result.affectedRows === 0) throw new AppError('Failed to assign technician', 500);

  const updatedOrder = await queryOne(
    `SELECT o.*, t.id AS technician_id, t.name AS technician_name
     FROM orders o
     LEFT JOIN users t ON o.technician_id = t.id
     WHERE o.id = ?`,
    [id]
  );

  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'assign', `Order assigned to technician ${technician.name}`, req.user.userId]
  );

  successResponse(res, 'Technician assigned successfully', updatedOrder);
});

// 技师主动接单 --------------------------------------------------------
export const claimOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;

  const result: any = await query(
    `UPDATE orders
     SET technician_id = ?, status = ?
     WHERE id = ? AND status = ?`,
    [req.user.userId, OrderStatus.IN_PROGRESS, id, OrderStatus.PENDING]
  );

  if (result.affectedRows === 0) {
    throw new AppError('Failed to claim order. It might already be taken.', 409);
  }

  const updatedOrder = await queryOne(
    `SELECT o.*, t.id AS technician_id, t.name AS technician_name
     FROM orders o
     LEFT JOIN users t ON o.technician_id = t.id
     WHERE o.id = ?`,
    [id]
  );

  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'claim', 'Order claimed by technician', req.user.userId]
  );

  successResponse(res, 'Order claimed successfully', updatedOrder);
});

// 技师接受指派 --------------------------------------------------------
export const acceptOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;

  const result: any = await query(
    `UPDATE orders
     SET status = ?
     WHERE id = ? AND technician_id = ? AND status = ?`,
    [OrderStatus.IN_PROGRESS, id, req.user.userId, OrderStatus.PENDING_ACCEPTANCE]
  );

  if (result.affectedRows === 0) throw new AppError('Failed to accept order', 400);

  const updatedOrder = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);

  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'accept', 'Technician accepted assignment', req.user.userId]
  );

  successResponse(res, 'Order accepted', updatedOrder);
});

// 技师拒绝指派 --------------------------------------------------------
export const rejectOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;

  const result: any = await query(
    `UPDATE orders
     SET technician_id = NULL, status = ?
     WHERE id = ? AND technician_id = ? AND status = ?`,
    [OrderStatus.PENDING, id, req.user.userId, OrderStatus.PENDING_ACCEPTANCE]
  );

  if (result.affectedRows === 0) throw new AppError('Failed to reject order', 400);

  const updatedOrder = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);

  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'reject', 'Technician rejected assignment; order returned to pending', req.user.userId]
  );

  successResponse(res, 'Order rejected', updatedOrder);
});

// 更新订单状态（通用入口） ---------------------------------------------
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;
  const { status }: UpdateOrderStatusRequest = req.body;

  if (!status) throw new AppError('Status is required', 400);
  if (!Object.values(OrderStatus).includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) throw new AppError('Order not found', 404);

  const role = req.user.role;
  const userId = req.user.userId;

  const isOrderOwner = order.user_id === userId;
  const isTechnicianOwner = order.technician_id === userId;

  let allowed = false;

  if (role === UserRole.ADMIN || role === UserRole.FINANCE) {
    allowed = true;
  } else if (role === UserRole.USER && isOrderOwner) {
    allowed = status === OrderStatus.CANCELLED && ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status);
  } else if (role === UserRole.TECHNICIAN && isTechnicianOwner) {
    allowed = [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED, OrderStatus.PAID].includes(status);
  }

  if (!allowed) {
    throw new AppError('Permission denied to update order status', 403);
  }

  const result: any = await query(
    'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id]
  );

  if (result.affectedRows === 0) throw new AppError('Failed to update order status', 400);

  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'status_change', `Order status changed to ${status}`, userId]
  );

  const updated = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  successResponse(res, 'Order status updated', updated);
});

// 技师转单或放弃 ------------------------------------------------------
export const transferOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;
  const { newTechnicianId } = req.body as { newTechnicianId?: string };

  if (!newTechnicianId) {
    const result: any = await query(
      `UPDATE orders
       SET technician_id = NULL, status = ?
       WHERE id = ? AND technician_id = ?`,
      [OrderStatus.PENDING, id, req.user.userId]
    );

    if (result.affectedRows === 0) throw new AppError('Failed to abandon order', 400);

    const data = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    await query(
      'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
      [id, 'abandon', 'Technician abandoned order; returned to pending', req.user.userId]
    );

    successResponse(res, 'Order abandoned successfully', data);
    return;
  }

  const technician = await queryOne(
    'SELECT id, name FROM users WHERE id = ? AND role = ?',
    [newTechnicianId, UserRole.TECHNICIAN]
  );
  if (!technician) throw new AppError('Target technician not found', 404);

  const result: any = await query(
    `UPDATE orders
     SET technician_id = ?, status = ?
     WHERE id = ? AND technician_id = ?`,
    [newTechnicianId, OrderStatus.PENDING_ACCEPTANCE, id, req.user.userId]
  );

  if (result.affectedRows === 0) throw new AppError('Failed to transfer order', 400);

  const data = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'transfer', `Order transferred to technician ${technician.name}`, req.user.userId]
  );

  successResponse(res, 'Order transferred successfully', data);
});

// 更新订单详情 --------------------------------------------------------
export const updateOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;
  const { diagnosis, actual_price, status } = req.body as { diagnosis?: string; actual_price?: number; status?: OrderStatus };

  const updateFields: string[] = [];
  const params: any[] = [];

  if (diagnosis !== undefined) {
    updateFields.push('diagnosis = ?');
    params.push(diagnosis);
  }
  if (actual_price !== undefined) {
    updateFields.push('actual_price = ?');
    params.push(actual_price);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    params.push(status);
  }

  if (updateFields.length === 0) throw new AppError('No fields to update', 400);

  params.push(id);

  const result: any = await query(
    `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
    params
  );

  if (result.affectedRows === 0) throw new AppError('Failed to update order details', 400);

  const data = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  await query(
    'INSERT INTO order_logs (order_id, action, notes, operator_id) VALUES (?, ?, ?, ?)',
    [id, 'update_details', 'Order details updated', req.user.userId]
  );

  successResponse(res, 'Order details updated', data);
});

// 添加维修日志 --------------------------------------------------------
export const addOrderLog = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  const { id } = req.params;
  const { notes, images } = req.body as { notes: string; images?: string[] };

  if (!notes || notes.trim().length === 0) {
    throw new AppError('Log notes cannot be empty', 400);
  }

  await query(
    `INSERT INTO order_logs (order_id, action, notes, images, operator_id)
     VALUES (?, ?, ?, ?, ?)`,
    [id, 'log', notes, JSON.stringify(images || []), req.user.userId]
  );

  const data = await queryOne(
    `SELECT ol.*, u.name AS operator_name
     FROM order_logs ol
     LEFT JOIN users u ON ol.operator_id = u.id
     WHERE ol.order_id = ? AND ol.operator_id = ?
     ORDER BY ol.created_at DESC
     LIMIT 1`,
    [id, req.user.userId]
  );

  successResponse(res, 'Log added successfully', data, 201);
});


