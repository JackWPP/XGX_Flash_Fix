-- 更新订单表的状态约束，添加accepted和paid状态
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled', 'paid'));

-- 添加缺失的字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS images TEXT[];

-- 确保订单表有正确的权限
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT ON orders TO anon;

-- 确保服务表有正确的权限
GRANT SELECT ON services TO authenticated;
GRANT SELECT ON services TO anon;