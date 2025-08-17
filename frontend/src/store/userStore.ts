import { create } from 'zustand';
import api from '../utils/axios';

type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedUsersResponse {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  limit: number;
}

interface UserState {
  users: User[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  fetchUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  createUser: (payload: { name: string; phone: string; password: string; email?: string; role: UserRole; avatar?: string }) => Promise<User>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
      });
      if (params.role) queryParams.append('role', params.role);
      if (params.search) queryParams.append('search', params.search);

      const response = await api.get<PaginatedUsersResponse>(`/api/v1/users?${queryParams.toString()}`);
      if (response.data.success) {
        set({
          users: response.data.data,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'An unknown error occurred' });
    }
  },

  updateUser: async (userId, userData) => {
    set({ isLoading: true });
    try {
      const response = await api.put<{ success: boolean; data: User }>(`/api/v1/users/${userId}`, userData);
      if (response.data.success) {
        const updatedUser = response.data.data;
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? updatedUser : user)),
          isLoading: false,
        }));
        return updatedUser;
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'An unknown error occurred' });
      throw error;
    }
  },

  createUser: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ success: boolean; data: User }>(`/api/v1/users`, payload);
      if (response.data.success) {
        const created = response.data.data;
        // 追加到本地列表（可选），并由调用方决定是否刷新
        set((state) => ({ users: [created, ...state.users], isLoading: false }));
        return created;
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error?.response?.data?.message || error.message || 'An unknown error occurred' });
      throw error;
    }
  },

  resetUserPassword: async (userId, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<{ success: boolean; message: string }>(`/api/v1/users/${userId}/reset-password`, { newPassword });
      if (response.data.success) {
        set({ isLoading: false });
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error?.response?.data?.message || error.message || 'An unknown error occurred' });
      throw error;
    }
  },
}));
