-- MySQL版本的订单工作流更新
USE xgx_flash_fix;

-- 步骤 1: 更新订单状态枚举
-- 先将现有 'assigned' 状态更新为 'in_progress'
UPDATE orders SET status = 'in_progress' WHERE status = 'assigned';

-- 修改订单表的状态字段，添加新的状态
ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'pending_acceptance', 'in_progress', 'completed', 'cancelled', 'paid', 'accepted') DEFAULT 'pending';

-- 步骤 2: 为订单表添加诊断字段
-- 用于技师填写诊断内容
ALTER TABLE orders ADD COLUMN diagnosis TEXT;

-- 步骤 3: 为订单日志表添加图片字段和action字段
-- 用于技师上传工作留痕照片
ALTER TABLE order_logs ADD COLUMN images JSON DEFAULT (JSON_ARRAY());

-- 添加 action 字段来描述日志类型
ALTER TABLE order_logs ADD COLUMN action VARCHAR(50) DEFAULT 'log' NOT NULL;

-- 重命名 created_by 为 operator_id 以更准确地反映操作者
ALTER TABLE order_logs CHANGE COLUMN created_by operator_id CHAR(36) NOT NULL;

-- 更新外键约束
ALTER TABLE order_logs DROP FOREIGN KEY order_logs_ibfk_2;
ALTER TABLE order_logs ADD CONSTRAINT fk_order_logs_operator FOREIGN KEY (operator_id) REFERENCES users(id);

COMMIT;