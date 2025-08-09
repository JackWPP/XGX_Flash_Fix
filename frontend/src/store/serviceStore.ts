import { create } from 'zustand';
import api from '../utils/axios';

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedServicesResponse {
  success: boolean;
  data: Service[];
  total: number;
  page: number;
  limit: number;
}

interface ServiceState {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  fetchServices: (params?: { page?: number; limit?: number; search?: string }) => Promise<void>;
  createService: (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service>;
  updateService: (serviceId: string, serviceData: Partial<Service>) => Promise<Service>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: [],
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,

  fetchServices: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams({
        page: params.page?.toString() || '1',
        limit: params.limit?.toString() || '10',
      });
      if (params.search) queryParams.append('search', params.search);

      const response = await api.get<PaginatedServicesResponse>(`/api/v1/services?${queryParams.toString()}`);
      if (response.data.success) {
        set({
          services: response.data.data,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'An unknown error occurred' });
    }
  },

  createService: async (serviceData) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ success: boolean; data: Service }>('/api/v1/services', serviceData);
      if (response.data.success) {
        set({ isLoading: false });
        const { fetchServices, page, limit } = get();
        fetchServices({ page, limit }); // Refresh
        return response.data.data;
      } else {
        throw new Error('Failed to create service');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'An unknown error occurred' });
      throw error;
    }
  },

  updateService: async (serviceId, serviceData) => {
    set({ isLoading: true });
    try {
      const response = await api.put<{ success: boolean; data: Service }>(`/api/v1/services/${serviceId}`, serviceData);
      if (response.data.success) {
        const updatedService = response.data.data;
        set((state) => ({
          services: state.services.map((service) => (service.id === serviceId ? updatedService : service)),
          isLoading: false,
        }));
        return updatedService;
      } else {
        throw new Error('Failed to update service');
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.message || 'An unknown error occurred' });
      throw error;
    }
  },
}));
