import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'SE2025',
  password: process.env.DB_PASSWORD || 'Cs22032025',
  database: process.env.DB_NAME || 'xgx_flash_fix',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00'
};

// Create MySQL connection pool
export const pool = mysql.createPool(dbConfig);

// Table name constants
export const TABLES = {
  USERS: 'users',
  SERVICES: 'services',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  ORDER_LOGS: 'order_logs'
} as const;

// Connection test helper
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

// Query helper
export const query = async (sql: string, params?: any[]): Promise<any> => {
  try {
    const [rows] = await pool.execute(sql, params || []);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Single row helper
export const queryOne = async (sql: string, params?: any[]): Promise<any> => {
  const rows = await query(sql, params);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

// Transaction helper
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

// Close connection pool
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('MySQL connection pool closed');
};

