// --- Enums ---
export type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';
export type OrderStatus = 'pending' | 'pending_acceptance' | 'in_progress' | 'completed' | 'cancelled' | 'paid';

// --- Interfaces ---
export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
}

export interface OrderLog {
  id: string;
  notes: string;
  images?: string[];
  created_at: string;
  operator_id: string;
  action: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  technician_id?: string;
  service_id: string;
  device_type: string;
  device_model?: string;
  issue_description: string;
  diagnosis?: string;
  urgency_level: string;
  status: OrderStatus;
  estimated_price?: number;
  actual_price?: number;
  contact_address: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
  // Relational data
  users: User;
  services: Service;
  technicians?: User;
  order_logs?: OrderLog[];
}

// --- API Payloads ---
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
