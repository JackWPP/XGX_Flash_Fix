-- 更新用户表的角色约束，添加service角色
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'technician', 'admin', 'finance', 'service'));

-- 确保用户表有正确的权限
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;