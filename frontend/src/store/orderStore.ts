import { create } from 'zustand';
import api from '../utils/axios';
import type { Order, OrderStatus, PaginatedResponse } from '../types';

interface OrderState {
  orders: Order[];
  unclaimedOrders: Order[];
  pendingAcceptanceOrders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };

  fetchOrders: (params: { status?: string; page?: number; limit?: number; search?: string }) => Promise<void>;
  fetchUnclaimedOrders: (params: { page?: number; limit?: number; search?: string }) => Promise<void>;
  fetchPendingAcceptanceOrders: (params: { page?: number; limit?: number; search?: string }) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (orderData: any) => Promise<void>;
  assignTechnician: (orderId: string, technicianId: string) => Promise<void>;
  claimOrder: (orderId: string) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  transferOrder: (orderId: string, newTechnicianId?: string) => Promise<void>;
  updateOrderDetails: (orderId: string, details: { diagnosis?: string; actual_price?: number; status?: OrderStatus }) => Promise<void>;
  addOrderLog: (orderId: string, log: { notes: string; images?: string[] }) => Promise<void>;
  clearError: () => void;
}

const handleApiCall = async <T>(apiCall: () => Promise<{ data: T }>, set: (state: Partial<OrderState>) => void): Promise<T> => {
  set({ isLoading: true, error: null });
  try {
    const result = await apiCall();
    set({ isLoading: false });
    return result.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    set({ isLoading: false, error: errorMessage });
    throw new Error(errorMessage);
  }
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  unclaimedOrders: [],
  pendingAcceptanceOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: { total: 0, page: 1, limit: 10 },

  fetchOrders: async (params) => {
    const response = await handleApiCall(() => api.get<PaginatedResponse<Order>>('/api/v1/orders', { params }), set);
    set({ orders: response.data, pagination: response.pagination });
  },

  fetchUnclaimedOrders: async (params) => {
    const queryParams = { ...params, view: 'unclaimed' };
    const response = await handleApiCall(() => api.get<PaginatedResponse<Order>>('/api/v1/orders', { params: queryParams }), set);
    set({ unclaimedOrders: response.data, pagination: response.pagination });
  },

  fetchPendingAcceptanceOrders: async (params) => {
    const queryParams = { ...params, status: 'pending_acceptance' };
    const response = await handleApiCall(() => api.get<PaginatedResponse<Order>>('/api/v1/orders', { params: queryParams }), set);
    set({ pendingAcceptanceOrders: response.data, pagination: response.pagination });
  },

  fetchOrderById: async (id) => {
    const response = await handleApiCall(() => api.get<{ data: Order }>(`/api/v1/orders/${id}`), set);
    set({ currentOrder: response.data });
  },

  createOrder: async (orderData) => {
    await handleApiCall(() => api.post('/api/v1/orders', orderData), set);
    get().fetchOrders({});
  },

  assignTechnician: async (orderId, technicianId) => {
    await handleApiCall(() => api.put(`/api/v1/orders/${orderId}/assign`, { technicianId }), set);
    get().fetchUnclaimedOrders({});
  },

  claimOrder: async (orderId) => {
    await handleApiCall(() => api.post(`/api/v1/orders/${orderId}/claim`), set);
    get().fetchUnclaimedOrders({});
  },

  acceptOrder: async (orderId) => {
    await handleApiCall(() => api.put(`/api/v1/orders/${orderId}/accept`), set);
    get().fetchPendingAcceptanceOrders({});
  },

  rejectOrder: async (orderId) => {
    await handleApiCall(() => api.put(`/api/v1/orders/${orderId}/reject`), set);
    get().fetchPendingAcceptanceOrders({});
  },

  updateOrderStatus: async (orderId, status) => {
    await handleApiCall(() => api.put(`/api/v1/orders/${orderId}/status`, { status }), set);
    const current = get().currentOrder;
    if (current && current.id === orderId) {
      await get().fetchOrderById(orderId);
    }
  },

  transferOrder: async (orderId, newTechnicianId) => {
    await handleApiCall(() => api.put(`/api/v1/orders/${orderId}/transfer`, { newTechnicianId }), set);
    get().fetchOrderById(orderId);
  },

  updateOrderDetails: async (orderId, details) => {
    const response = await handleApiCall(() => api.put<{ data: Order }>(`/api/v1/orders/${orderId}/details`, details), set);
    set({ currentOrder: response.data });
  },

  addOrderLog: async (orderId, log) => {
    await handleApiCall(() => api.post(`/api/v1/orders/${orderId}/logs`, log), set);
    get().fetchOrderById(orderId);
  },

  clearError: () => set({ error: null })
}));

