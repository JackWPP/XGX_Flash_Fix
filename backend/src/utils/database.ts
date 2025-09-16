import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'SE2025',
  password: process.env.DB_PASSWORD || 'Cs22032025',
  database: process.env.DB_NAME || 'xgx_flash_fix',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00'
};

// 创建MySQL连接池
export const pool = mysql.createPool(dbConfig);

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
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL database connection successful');
    return true;
  } catch (error) {
    console.error('MySQL database connection test failed:', error);
    return false;
  }
};

// 执行查询的辅助函数
export const query = async (sql: string, params?: any[]): Promise<any> => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// 获取单条记录
export const queryOne = async (sql: string, params?: any[]): Promise<any> => {
  const rows = await query(sql, params);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

// 执行事务
export const transaction = async (callback: (connection: mysql.PoolConnection) => Promise<any>): Promise<any> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 关闭数据库连接池
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('MySQL connection pool closed');
};