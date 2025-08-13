-- 步骤 1: 更新订单状态枚举
-- 为实现平滑过渡，我们先移除旧约束，最后再添加新约束

-- 移除旧的 'orders_status_check' 约束
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 将现有 'assigned' 状态更新为 'in_progress'，因为 'assigned' 的概念被 'pending_acceptance' 替代
UPDATE public.orders SET status = 'in_progress' WHERE status = 'assigned';

-- 添加新的订单状态 'pending_acceptance'
-- 新的状态流程: pending -> pending_acceptance -> in_progress -> completed -> cancelled
ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'pending_acceptance', 'in_progress', 'completed', 'cancelled', 'paid', 'accepted'));


-- 步骤 2: 为订单表添加诊断字段
-- 用于技师填写诊断内容
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS diagnosis TEXT;


-- 步骤 3: 为订单日志表添加图片字段
-- 用于技师上传工作留痕照片
ALTER TABLE public.order_logs ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 步骤 4: 调整 order_logs 表的字段，使其更适合作为通用日志
-- 移除不必要的 status 字段，因为状态变更由 orders 表自身跟踪
-- 添加 action 字段来描述日志类型
ALTER TABLE public.order_logs DROP COLUMN IF EXISTS status;
ALTER TABLE public.order_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50) DEFAULT 'log' NOT NULL; -- 例如: 'log', 'status_change', 'assign'

-- 重命名 created_by 为 operator_id 以更准确地反映操作者
ALTER TABLE public.order_logs RENAME COLUMN created_by TO operator_id;

-- 步骤 5: 更新RLS策略以适应新字段和逻辑
-- 确保技师可以更新诊断和最终价格字段
-- (现有的 UPDATE 策略已足够，无需修改)

-- 确保技师可以向 order_logs 插入带图片的日志
-- (现有的 INSERT 策略已足够，无需修改)

-- 授予新列的权限
GRANT UPDATE(diagnosis) ON public.orders TO authenticated;
GRANT INSERT(images, action) ON public.order_logs TO authenticated;

COMMIT;
