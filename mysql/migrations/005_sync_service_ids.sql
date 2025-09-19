-- Sync core service IDs with frontend mapping (MySQL)
-- Ensure session uses UTF-8 for Chinese characters on Windows clients
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

USE xgx_flash_fix;

-- Ensure the six core services exist with the exact IDs expected by the frontend
-- and are active. Uses INSERT ... ON DUPLICATE KEY UPDATE on primary key `id`.

INSERT INTO services (id, name, description, category, base_price, estimated_duration, is_active)
VALUES
  ('0c3cb522-9cb6-495e-8d86-edcabc27004c', '绯荤粺閲嶈', '鐢佃剳绯荤粺閲嶆柊瀹夎鏈嶅姟', 'computer', 50, 120, TRUE),
  ('66cfe81e-250b-422e-9e16-d6d18ff8ce2e', '娓呯伆鏈嶅姟', '鐢佃剳鍐呴儴娓呯伆闄ゅ皹鏈嶅姟', 'computer', 30, 60, TRUE),
  ('4363c4f4-55b1-4151-bae2-47197eb8ef6f', '杞欢瀹夎', '鍚勭被杞欢瀹夎閰嶇疆鏈嶅姟', 'software', 20, 30, TRUE),
  ('b2fc7a9a-ffaa-4d09-8e9c-0e91b9ff7774', '鐢佃剳杩涙按', '鐢佃剳杩涙按鎹熷潖缁翠慨鏈嶅姟', 'repair', 100, 180, TRUE),
  ('f4a8b2c1-1234-5678-9abc-def012345678', '鎵嬫満鐢垫睜鏇存崲', '鎵嬫満鐢垫睜鏇存崲鏈嶅姟', 'mobile', 80, 45, TRUE),
  ('a908380e-39d9-43ab-8c91-355d9834ad99', '鎵嬫満灞忓箷鏇存崲', '鎵嬫満灞忓箷鏇存崲缁翠慨鏈嶅姟', 'mobile', 150, 90, TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  category = VALUES(category),
  base_price = VALUES(base_price),
  estimated_duration = VALUES(estimated_duration),
  is_active = VALUES(is_active),
  updated_at = NOW();

COMMIT;

