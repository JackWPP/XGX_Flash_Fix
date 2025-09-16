-- 更新用户密码哈希
UPDATE users SET password_hash = '$2b$12$cR3HDzDbOVneCoH/NzzSqebAI7JwUqbF9rIrf.FChyOSsM76KJuIG' WHERE phone = '13800000001';
UPDATE users SET password_hash = '$2b$12$LVhDt3WLhxImiM.KRZnRae/r.dFym38L3OY2ZxMgbJHoUk62YLhJK' WHERE phone = '13800000002';
UPDATE users SET password_hash = '$2b$12$nUoCVdQ.fRJXMwkkAx9bTuRehrJXSh/TqXbbI73nFgUGZRJXBXRnO' WHERE phone = '13800000003';

-- 验证更新结果
SELECT id, name, phone, role, LENGTH(password_hash) as hash_length, password_hash FROM users ORDER BY id;