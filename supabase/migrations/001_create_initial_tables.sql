-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin', 'finance')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建服务表
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_duration INTEGER, -- 预估时长（分钟）
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  technician_id UUID REFERENCES users(id),
  device_type VARCHAR(100) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  issue_description TEXT NOT NULL,
  urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  preferred_time TIMESTAMP WITH TIME ZONE,
  contact_address TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单日志表
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建支付表
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建评价表
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  technician_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_technician_id ON orders(technician_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);

-- 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 用户表RLS策略
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' IN ('admin'));

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' IN ('admin'));

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 服务表RLS策略
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 订单表RLS策略
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = technician_id::text OR 
    auth.jwt() ->> 'role' IN ('admin', 'finance')
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users and technicians can update orders" ON orders
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = technician_id::text OR 
    auth.jwt() ->> 'role' IN ('admin', 'finance')
  );

-- 订单日志表RLS策略
CREATE POLICY "Users can view order logs for their orders" ON order_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_logs.order_id 
      AND (
        auth.uid()::text = orders.user_id::text OR 
        auth.uid()::text = orders.technician_id::text OR 
        auth.jwt() ->> 'role' IN ('admin', 'finance')
      )
    )
  );

CREATE POLICY "Authenticated users can create order logs" ON order_logs
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

-- 支付表RLS策略
CREATE POLICY "Users can view payments for their orders" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND (
        auth.uid()::text = orders.user_id::text OR 
        auth.jwt() ->> 'role' IN ('admin', 'finance')
      )
    )
  );

CREATE POLICY "Finance and admins can manage payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'finance'));

-- 评价表RLS策略
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their orders" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = reviews.order_id 
      AND orders.user_id = reviews.user_id
      AND orders.status = 'completed'
    )
  );

-- 插入初始数据
-- 插入管理员用户
INSERT INTO users (id, name, phone, email, password_hash, role) VALUES 
('00000000-0000-0000-0000-000000000001', '系统管理员', '13800000001', 'admin@xgxflashfix.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG', 'admin'),
('00000000-0000-0000-0000-000000000002', '财务人员', '13800000002', 'finance@xgxflashfix.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG', 'finance'),
('00000000-0000-0000-0000-000000000003', '技术员张师傅', '13800000003', 'tech1@xgxflashfix.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8B9H7aG', 'technician');

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

COMMIT;