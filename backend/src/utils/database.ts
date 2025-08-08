import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// 创建Supabase客户端（使用服务角色密钥，用于服务端操作）
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 创建用于用户认证的Supabase客户端（使用匿名密钥）
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key');
}

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  SERVICES: 'services',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  ORDER_LOGS: 'order_logs'
} as const;

// 数据库连接测试
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};