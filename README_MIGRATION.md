# 数据库迁移指南

## 概述

本项目已从 Supabase (PostgreSQL) 迁移到 MySQL 数据库。以下是迁移的详细说明和使用指南。

## 数据库配置

### 环境变量配置

在 `backend/.env` 文件中配置以下 MySQL 连接信息：

```env
# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=SE2025
DB_PASSWORD=Cs22032025
DB_NAME=xgx_flash_fix
```

### 数据库初始化

1. **创建数据库和表结构**

   使用以下 SQL 脚本初始化数据库：
   ```bash
   mysql -u SE2025 -p < mysql/migrations/003_create_migration_script.sql
   ```

2. **或者手动执行迁移文件**

   按顺序执行以下文件：
   - `mysql/migrations/001_create_initial_tables.sql`
   - `mysql/migrations/002_update_order_workflow.sql`
   - `mysql/migrations/005_sync_service_ids.sql`（确保与前端服务映射一致）

3. **（重要）同步服务 ID 映射**

   如果你是从旧库升级，或遇到前端下单时提示 `Service not found or inactive`，请执行：
   ```bash
   mysql -u SE2025 -p xgx_flash_fix < mysql/migrations/005_sync_service_ids.sql
   ```

## 主要变更

### 1. 数据库连接

- **之前**: 使用 `@supabase/supabase-js` 客户端
- **现在**: 使用 `mysql2` 连接池

### 2. 数据类型映射

| Supabase (PostgreSQL) | MySQL |
|----------------------|-------|
| UUID | CHAR(36) |
| TIMESTAMP WITH TIME ZONE | TIMESTAMP |
| JSONB | JSON |
| TEXT | TEXT |
| BOOLEAN | BOOLEAN |

### 3. 主要功能对比

| 功能 | Supabase | MySQL |
|------|----------|-------|
| 主键生成 | `gen_random_uuid()` | `UUID()` |
| 时间戳 | `NOW()` | `NOW()` |
| JSON 字段 | JSONB | JSON |
| 枚举类型 | CHECK 约束 | ENUM |

### 4. 查询语法变更

**之前（Supabase）**：
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('phone', phone)
  .single();
```

**现在（MySQL）**：
```javascript
const user = await queryOne('SELECT * FROM users WHERE phone = ?', [phone]);
```

## 数据库表结构

### 用户表（users）
```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'technician', 'admin', 'finance') DEFAULT 'user',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 服务表（services）
```sql
CREATE TABLE services (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_duration INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 订单表（orders）
```sql
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id CHAR(36) NOT NULL,
  service_id CHAR(36) NOT NULL,
  technician_id CHAR(36),
  device_type VARCHAR(100) NOT NULL,
  device_model VARCHAR(100) NOT NULL,
  issue_description TEXT NOT NULL,
  urgency_level ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  status ENUM('pending', 'pending_acceptance', 'in_progress', 'completed', 'cancelled', 'paid', 'accepted') DEFAULT 'pending',
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  preferred_time TIMESTAMP NULL,
  contact_address TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  diagnosis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (technician_id) REFERENCES users(id)
);
```

## 启动项目

1. **安装依赖**
   ```bash
   cd backend
   npm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置 MySQL 连接信息
   ```

3. **初始化数据库**
   ```bash
   mysql -u SE2025 -p < mysql/migrations/003_create_migration_script.sql
   ```

4. **同步服务 ID 映射（重要）**
   ```bash
   mysql -u SE2025 -p xgx_flash_fix < mysql/migrations/005_sync_service_ids.sql
   ```

5. **启动后端服务**
   ```bash
   npm run dev
   ```

## 注意事项

1. **权限管理**：MySQL 版本移除了 Supabase 的 RLS（行级安全）策略，权限控制完全在应用层实现。
2. **事务处理**：使用 MySQL 的事务机制替代 Supabase 的自动事务。
3. **连接池**：使用 `mysql2` 的连接池管理数据库连接。
4. **错误处理**：统一的错误处理机制，包装 MySQL 错误信息。

## 测试

确保所有 API 端点正常工作：
- 用户注册 / 登录
- 订单创建 / 查询
- 服务管理
- 用户管理

## 故障排除

1. **连接失败**：检查 MySQL 服务是否启动，用户名密码是否正确。
2. **表不存在**：确保已执行数据库迁移脚本。
3. **权限错误**：确保 MySQL 用户有足够的权限操作数据库。

## 性能优化建议

1. 为常用查询字段添加索引。
2. 使用连接池管理数据库连接。
3. 实现查询缓存机制。
4. 定期优化数据库表结构。

