import { Request, Response } from 'express';
import { query, queryOne } from '../utils/database.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { UserRole } from '../types/index.js';

// List services --------------------------------------------------------
export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, category, isActive, search } = req.query as any;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const offset = (pageNum - 1) * limitNum;

  const where: string[] = [];
  const params: any[] = [];

  if (category) {
    where.push('category = ?');
    params.push(String(category));
  }
  if (typeof isActive !== 'undefined') {
    where.push('is_active = ?');
    params.push(String(isActive) === 'true');
  }
  if (search) {
    where.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${String(search)}%`, `%${String(search)}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countRow = await queryOne(`SELECT COUNT(*) AS total FROM services ${whereClause}`, params);
  const total = Number(countRow?.total || 0);

  const services = await query(
    `SELECT * FROM services ${whereClause} ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
    params
  );

  paginatedResponse(
    res,
    'Services retrieved successfully',
    services || [],
    pageNum,
    limitNum,
    total
  );
});

// Get service by id ----------------------------------------------------
export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const service = await queryOne('SELECT * FROM services WHERE id = ?', [id]);
  if (!service) throw new AppError('Service not found', 404);
  successResponse(res, 'Service retrieved successfully', service);
});

// Create service (admin only) -----------------------------------------
export const createService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  if (req.user.role !== UserRole.ADMIN) throw new AppError('Access denied', 403);

  const { name, description, category, base_price, estimated_duration, is_active = true } = req.body;

  if (!name || !description || !category || base_price === undefined || base_price === null) {
    throw new AppError('Name, description, category, and base price are required', 400);
  }
  if (Number(base_price) < 0) throw new AppError('Base price must be non-negative', 400);

  await query(
    `INSERT INTO services (name, description, category, base_price, estimated_duration, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, category, base_price, estimated_duration || null, !!is_active]
  );

  const created = await queryOne(
    `SELECT * FROM services WHERE name = ? AND category = ? ORDER BY created_at DESC LIMIT 1`,
    [name, category]
  );

  successResponse(res, 'Service created successfully', created, 201);
});

// Update service (admin only) -----------------------------------------
export const updateService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  if (req.user.role !== UserRole.ADMIN) throw new AppError('Access denied', 403);

  const { id } = req.params;
  const { name, description, category, base_price, estimated_duration, is_active } = req.body;

  const fields: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    fields.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    fields.push('description = ?');
    params.push(description);
  }
  if (category !== undefined) {
    fields.push('category = ?');
    params.push(category);
  }
  if (base_price !== undefined) {
    if (Number(base_price) < 0) throw new AppError('Base price must be non-negative', 400);
    fields.push('base_price = ?');
    params.push(base_price);
  }
  if (estimated_duration !== undefined) {
    fields.push('estimated_duration = ?');
    params.push(estimated_duration);
  }
  if (is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(!!is_active);
  }
  fields.push('updated_at = NOW()');

  if (!fields.length) {
    const current = await queryOne('SELECT * FROM services WHERE id = ?', [id]);
    if (!current) throw new AppError('Service not found', 404);
    successResponse(res, 'Service updated successfully', current);
    return;
  }

  params.push(id);
  await query(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, params);
  const updated = await queryOne('SELECT * FROM services WHERE id = ?', [id]);
  if (!updated) throw new AppError('Service not found', 404);
  successResponse(res, 'Service updated successfully', updated);
});

// Delete service (admin only) -----------------------------------------
export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('User not authenticated', 401);
  if (req.user.role !== UserRole.ADMIN) throw new AppError('Access denied', 403);

  const { id } = req.params;

  const existOrder = await queryOne('SELECT id FROM orders WHERE service_id = ? LIMIT 1', [id]);
  if (existOrder) throw new AppError('Cannot delete service with existing orders', 400);

  await query('DELETE FROM services WHERE id = ?', [id]);
  successResponse(res, 'Service deleted successfully');
});

// List service categories ---------------------------------------------
export const getServiceCategories = asyncHandler(async (req: Request, res: Response) => {
  const rows = await query('SELECT DISTINCT category FROM services WHERE is_active = 1');
  const categories = (rows || []).map((r: any) => r.category).sort();
  successResponse(res, 'Service categories retrieved successfully', categories);
});

// Popular services ----------------------------------------------------
export const getPopularServices = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query as any;
  const limitNum = Math.max(1, Number(limit));

  const rows = await query(
    `SELECT s.*, COALESCE(COUNT(o.id), 0) AS orderCount
     FROM services s
     LEFT JOIN orders o ON o.service_id = s.id
     WHERE s.is_active = 1
     GROUP BY s.id
     ORDER BY orderCount DESC, s.created_at DESC
     LIMIT ${limitNum}`
  );

  successResponse(res, 'Popular services retrieved successfully', rows || []);
});


