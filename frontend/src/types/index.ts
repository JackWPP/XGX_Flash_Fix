// 用户角色类型
export type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

// 用户信息类型
export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 订单状态类型
export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

// 订单紧急程度类型
export type OrderUrgency = 'urgent' | 'normal';

// 服务项目类型
export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  options: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 订单类型
export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  service_id: string;
  technician_id?: string;
  status: OrderStatus;
  scheduled_time: string;
  address: string;
  final_price: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // 关联数据
  users: {
    name: string;
    phone: string;
    email: string;
  };
  services: {
    name: string;
    description: string;
    category: string;
    base_price: number;
    duration: number;
  };
  technicians?: {
    name: string;
    phone: string;
    specialties?: string[];
  };
}

// 支付状态类型
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// 支付类型
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

// 评价类型
export interface Review {
  id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment?: string;
  images: string[];
  createdAt: string;
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// 登录请求类型
export interface LoginRequest {
  phone: string;
  password: string;
  role?: UserRole;
}

// 登录响应类型
export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

// 创建订单请求类型
export interface CreateOrderRequest {
  serviceType: string;
  deviceModel?: string;
  description: string;
  images?: string[];
  urgency?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  estimatedPrice?: number;
}

// 创建订单响应类型
export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNo: string;
}