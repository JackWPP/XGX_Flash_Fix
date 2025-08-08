-- 更新服务表数据，确保与前端服务映射一致
-- 使用UPSERT策略更新现有服务或插入新服务

-- 使用ON CONFLICT来处理已存在的服务ID
INSERT INTO services (id, name, description, category, base_price, estimated_duration, is_active) VALUES
('0c3cb522-9cb6-495e-8d86-edcabc27004c', '系统重装', '电脑系统重新安装服务', 'computer', 50, 120, true),
('66cfe81e-250b-422e-9e16-d6d18ff8ce2e', '清灰服务', '电脑内部清灰除尘服务', 'computer', 30, 60, true),
('4363c4f4-55b1-4151-bae2-47197eb8ef6f', '软件安装', '各类软件安装配置服务', 'software', 20, 30, true),
('b2fc7a9a-ffaa-4d09-8e9c-0e91b9ff7774', '电脑进水', '电脑进水损坏维修服务', 'repair', 100, 180, true),
('f4a8b2c1-1234-5678-9abc-def012345678', '手机电池更换', '手机电池更换服务', 'mobile', 80, 45, true),
('a908380e-39d9-43ab-8c91-355d9834ad99', '手机屏幕更换', '手机屏幕更换维修服务', 'mobile', 150, 90, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  base_price = EXCLUDED.base_price,
  estimated_duration = EXCLUDED.estimated_duration,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 确保权限正确设置
GRANT SELECT ON services TO anon;
GRANT SELECT ON services TO authenticated;