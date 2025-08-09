import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// 本地类型定义
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

interface LoginRequest {
  phone: string;
  password: string;
  role?: UserRole;
}

interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
}

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    phone: string;
    role: UserRole;
  };
}
import api from '../utils/axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<User>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials: LoginRequest) => {
      try {
        set({ isLoading: true, error: null });
        
        const response = await api.post<LoginResponse>('/api/v1/auth/login', credentials);
        
        if (response.data.success) {
          const { token, user } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return user; // 返回 user 对象
        } else {
          throw new Error('登录失败');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '登录失败';
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    register: async (userData: RegisterRequest) => {
      try {
        set({ isLoading: true, error: null });
        
        const response = await api.post<RegisterResponse>('/api/v1/auth/register', userData);
        
        if (response.data.success) {
          set({
            isLoading: false,
            error: null
          });
        } else {
          throw new Error(response.data.message || '注册失败');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '注册失败';
        set({
          isLoading: false,
          error: errorMessage
        });
        throw error;
      }
    },

    logout: () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      });
    },

    clearError: () => {
      set({ error: null });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated
    })
  }
));