-- 完整的MySQL数据库迁移脚本
-- 新干线闪修平台数据库初始化

-- 创建数据库
CREATE DATABASE IF NOT EXISTS xgx_flash_fix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xgx_flash_fix;

-- 删除已存在的表（按依赖关系逆序删除）
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_logs;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;

-- 创建用户表
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'technician', 'admin', 'finance') DEFAULT 'user',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_phone (phone),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建服务表
CREATE TABLE services (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_duration INT COMMENT '预估时长（分钟）',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建订单表
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  technician_id CHAR(36),
  device_type VARCHAR(100) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  issue_description TEXT NOT NULL,
  urgency_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  status ENUM('pending', 'pending_acceptance', 'in_progress', 'completed', 'cancelled', 'paid', 'accepted') DEFAULT 'pending',
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  preferred_time TIMESTAMP NULL,
  contact_address TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  diagnosis TEXT COMMENT '技师诊断内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (technician_id) REFERENCES users(id),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_technician_id (technician_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建订单日志表
CREATE TABLE order_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  action VARCHAR(50) DEFAULT 'log' NOT NULL COMMENT '日志类型：log, status_change, assign等',
  notes TEXT,
  images JSON DEFAULT (JSON_ARRAY()) COMMENT '工作留痕照片',
  operator_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id),
  INDEX idx_order_logs_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建支付表
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_payments_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建评价表
CREATE TABLE reviews (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  technician_id CHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (technician_id) REFERENCES users(id),
  INDEX idx_reviews_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始数据
-- 插入管理员用户（密码为 admin123）
INSERT INTO users (id, name, phone, email, password_hash, role) VALUES 
('00000000-0000-0000-0000-000000000001', '管理员', '13800000001', 'admin@xgxflashfix.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG', 'admin'),
('00000000-0000-0000-0000-000000000002', '财务', '13800000002', 'finance@xgxflashfix.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG', 'finance'),
('00000000-0000-0000-0000-000000000003', '张师傅', '13800000003', 'tech1@xgxflashfix.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG', 'technician');

-- 插入服务项目
INSERT INTO services (name, description, category, base_price, estimated_duration) VALUES 
('手机屏幕维修', '更换破损的手机屏幕，恢复正常显示功能', '手机维修', 200.00, 60),
('手机电池更换', '更换老化的手机电池，提升续航能力', '手机维修', 120.00, 30),
('手机进水处理', '专业清洁处理进水手机，恢复正常功能', '手机维修', 150.00, 90),
('笔记本清灰', '深度清理笔记本内部灰尘，提升散热效果', '电脑维修', 80.00, 45),
('笔记本屏幕维修', '更换破损的笔记本屏幕', '电脑维修', 300.00, 90),
('系统重装', '重新安装操作系统，解决系统问题', '电脑维修', 100.00, 120),
('数据恢复', '恢复误删除或损坏的重要数据', '数据服务', 200.00, 180),
('硬盘更换', '更换故障硬盘，提升存储性能', '电脑维修', 250.00, 60);

-- 创建数据库用户（如果需要）
-- CREATE USER IF NOT EXISTS 'SE2025'@'localhost' IDENTIFIED BY 'Cs22032025';
-- GRANT ALL PRIVILEGES ON xgx_flash_fix.* TO 'SE2025'@'localhost';
-- FLUSH PRIVILEGES;

COMMIT;