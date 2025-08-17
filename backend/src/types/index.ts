// 用户角色枚举
export enum UserRole {
  USER = 'user',
  TECHNICIAN = 'technician',
  ADMIN = 'admin',
  SERVICE = 'service',
  FINANCE = 'finance'
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  PENDING_ACCEPTANCE = 'pending_acceptance', // 新增：待技师接收
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAID = 'paid'
}

// 用户信息接口
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 服务项目接口
export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 订单接口
export interface Order {
  id: string;
  userId: string;
  technicianId?: string;
  serviceType: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: OrderStatus;
  contactName: string;
  contactPhone: string;
  address: string;
  images?: string[];
  estimatedPrice: number;
  finalPrice?: number;
  rating?: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// 支付信息接口
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: 'wechat' | 'alipay' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// 评价接口
export interface Review {
  id: string;
  orderId: string;
  userId: string;
  technicianId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// 订单日志接口
export interface OrderLog {
  id: string;
  orderId: string;
  action: string;
  description: string;
  operatorId: string;
  operatorRole: UserRole;
  createdAt: string;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 登录请求接口
export interface LoginRequest {
  phone: string;
  password: string;
  // 角色在“管理员登录”场景下可省略，由服务端根据手机号查找并返回实际角色
  role?: UserRole;
}

// 登录响应接口
export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

// 创建订单请求接口
export interface CreateOrderRequest {
  serviceId: string;
  deviceType: string;
  deviceModel?: string;
  issueDescription: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent' | 'normal';
  preferredTime?: string;
  contactPhone: string;
  contactAddress?: string;
  images?: string[];
}

// 更新订单状态请求接口
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  technicianId?: string;
  finalPrice?: number;
  notes?: string;
}

// JWT载荷接口
export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express Request扩展
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}