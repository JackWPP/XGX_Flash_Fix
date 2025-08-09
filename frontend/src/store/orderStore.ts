import { create } from 'zustand';
// 本地类型定义
type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'paid';

type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  options: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNo?: string;
  userId: string;
  serviceId?: string;
  serviceType: string;
  deviceModel?: string;
  description: string;
  images: string[];
  urgency: string;
  status: OrderStatus;
  quotedPrice?: number;
  finalPrice?: number;
  estimatedPrice?: number;
  assignedTo?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  service?: Service;
  assignedUser?: User;
}

interface CreateOrderRequest {
  serviceId: string;
  deviceType: string;
  deviceModel?: string;
  issueDescription: string;
  urgencyLevel?: string;
  contactAddress?: string;
  contactPhone?: string;
  images?: string[];
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNo: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
import api from '../utils/axios';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  
  // Actions
  fetchOrders: (params?: { status?: string; page?: number; limit?: number; search?: string }) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (orderData: CreateOrderRequest) => Promise<CreateOrderResponse>;
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<void>;
  assignTechnician: (orderId: string, technicianId: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,

  fetchOrders: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const { status, page = 1, limit = 10, search } = params;
      const queryParams = new URLSearchParams();
      
      if (status) queryParams.append('status', status);
      if (search) queryParams.append('search', search);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await api.get<PaginatedResponse<Order>>(
        `/api/v1/orders?${queryParams.toString()}`
      );
      
      if (response.data.success) {
        set({
          orders: response.data.data,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error('获取订单列表失败');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取订单列表失败';
      set({
        orders: [],
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get<{ success: boolean; data: Order }>(
        `/api/v1/orders/${id}`
      );
      
      if (response.data.success) {
        set({
          currentOrder: response.data.data,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error('获取订单详情失败');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '获取订单详情失败';
      set({
        currentOrder: null,
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  createOrder: async (orderData: CreateOrderRequest) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post<CreateOrderResponse>('/api/v1/orders', orderData);
      
      if (response.data.success) {
        set({ isLoading: false, error: null });
        
        // 刷新订单列表
        const { fetchOrders } = get();
        await fetchOrders();
        
        return response.data;
      } else {
        throw new Error('创建订单失败');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '创建订单失败';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.patch(`/api/v1/orders/${orderId}/status`, { status, notes });
      
      if (response.data.success) {
        // 更新本地状态
        const { orders, currentOrder } = get();
        
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, status: status as OrderStatus } : order
        );
        
        const updatedCurrentOrder = currentOrder?.id === orderId 
          ? { ...currentOrder, status: status as OrderStatus }
          : currentOrder;
        
        set({
          orders: updatedOrders,
          currentOrder: updatedCurrentOrder,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error('更新订单状态失败');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新订单状态失败';
      set({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  assignTechnician: async (orderId: string, technicianId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post(`/api/v1/orders/${orderId}/assign`, { technicianId });
      if (response.data.success) {
        const { fetchOrders, page, limit } = get();
        await fetchOrders({ page, limit }); // Refresh the list
        set({ isLoading: false });
      } else {
        throw new Error('Failed to assign technician');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'An unknown error occurred' });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  }
}));