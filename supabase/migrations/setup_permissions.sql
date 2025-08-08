-- 检查当前权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 为用户表设置权限
-- 允许匿名用户注册（插入新用户）
GRANT INSERT ON users TO anon;
-- 允许认证用户查看和更新自己的信息
GRANT SELECT, UPDATE ON users TO authenticated;

-- 为服务表设置权限
-- 允许所有用户查看服务
GRANT SELECT ON services TO anon;
GRANT SELECT ON services TO authenticated;

-- 为订单表设置权限
-- 允许认证用户创建和查看订单
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;

-- 为订单日志表设置权限
GRANT SELECT, INSERT ON order_logs TO authenticated;

-- 为支付表设置权限
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;

-- 为评价表设置权限
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;