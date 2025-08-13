-- 这个脚本用于将旧的、正在进行的订单迁移到新的工作流中
-- 它会重置最多5个最近的“已指派”或“进行中”的订单，让它们出现在“接单大厅”中

-- 步骤 1: 开启一个事务，确保操作的原子性
BEGIN;

-- 步骤 2: 找到需要迁移的订单ID
-- 我们只选择那些在旧系统中正在处理，但在新系统中“卡住”的订单
-- 我们按时间倒序，只选择最新的5条，以最大程度地减少影响
CREATE TEMP TABLE orders_to_migrate AS
SELECT id
FROM public.orders
WHERE status IN ('assigned', 'accepted', 'in_progress')
ORDER BY created_at DESC
LIMIT 5;

-- 步骤 3: 更新这些选定的订单
-- 将它们的状态设置为 'pending'，并清除已分配的技师
-- 这样它们就能出现在新的“接单大厅”中
UPDATE public.orders
SET 
  status = 'pending',
  technician_id = NULL
WHERE id IN (SELECT id FROM orders_to_migrate);

-- 步骤 4: 为这些更新过的订单添加一条日志，说明情况
INSERT INTO public.order_logs (order_id, action, notes, operator_id)
SELECT 
  id,
  'migration',
  '订单状态已由系统迁移重置为“待处理”，以适应新的工作流程。',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) -- 使用一个管理员账户作为操作员
FROM orders_to_migrate;

-- 步骤 5: 清理临时表
DROP TABLE orders_to_migrate;

-- 步骤 6: 提交事务
COMMIT;

-- 迁移完成
