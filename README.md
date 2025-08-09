# 新干线闪修平台

一个现代化的设备维修服务平台，为用户提供便捷的维修预约和管理服务。

## 项目概述

新干线闪修平台是一个全栈Web应用，旨在连接需要设备维修的用户和专业的维修技师。平台提供了完整的维修服务流程，从预约下单到维修完成的全程跟踪。

### 主要功能

#### 用户端

- 🔐 用户注册与登录
- 📱 设备维修预约（手机、电脑等）
- 📋 订单状态跟踪
- 💰 在线支付
- ⭐ 服务评价
- 👤 个人信息管理
- 🏠 首页展示和服务浏览

#### 技师端

- 🔧 接单管理
- 📊 工作台面板
- 📝 维修进度更新
- 💼 收入统计
- 📱 移动端适配

#### 管理端

- 👥 用户管理（用户、技师、管理员、财务）
- 🛠️ 服务项目管理
- 📈 订单管理和分配
- 💹 财务管理和支付处理
- 📊 数据统计和报表
- 🔐 权限管理

## 📚 文档

### 开发文档

- [开发指南](./docs/开发指南.md) - 项目搭建、开发规范、常见问题
- [技术架构文档](./docs/技术架构文档.md) - 系统架构设计和技术选型
- [开发文档](./docs/开发文档.md) - 详细的开发说明和更新日志
- [API文档](./docs/API文档.md) - 完整的后端API接口文档

### 项目文档

- [产品需求文档](./docs/产品需求文档.md) - 产品功能需求和业务逻辑
- [变更日志](./docs/CHANGELOG.md) - 版本更新历史和变更记录

### 快速导航

- 🚀 [快速开始](#-快速开始) - 环境搭建和项目启动
- 🔧 [开发指南](./docs/开发指南.md#开发服务器启动) - 开发环境配置
- 📖 [API文档](./docs/API文档.md) - 接口调用说明
- 🐛 [常见问题](./docs/开发指南.md#常见问题和故障排除) - 问题排查和解决方案

## 技术栈

### 前端

- **React 18** - 现代化的用户界面框架，支持并发特性
- **TypeScript 5.x** - 类型安全的JavaScript超集
- **Ant Design 5.x** - 企业级UI设计语言和组件库
- **React Router DOM 6.x** - 单页应用路由管理
- **Zustand 4.x** - 轻量级状态管理库
- **Axios 1.x** - 基于Promise的HTTP客户端
- **Tailwind CSS 3.x** - 实用优先的CSS框架
- **Vite 5.x** - 快速的前端构建工具

### 后端

- **Node.js 18+** - JavaScript运行时环境
- **Express.js 4.x** - 成熟稳定的Web应用框架
- **TypeScript 5.x** - 服务端类型安全开发
- **Supabase 2.x** - 开源的Firebase替代方案，提供数据库、认证、存储服务
- **PostgreSQL** - 企业级关系型数据库（通过Supabase托管）
- **JWT (jsonwebtoken)** - 无状态身份验证
- **bcryptjs** - 密码哈希加密
- **CORS** - 跨域资源共享中间件
- **Helmet** - Express安全中间件
- **Morgan** - HTTP请求日志记录
- **Multer** - 多部分表单数据和文件上传处理

### 开发工具

- **ESLint** - 代码质量检查
- **TSX** - TypeScript执行器
- **Git** - 版本控制

## 项目结构

```
XGX_Flash_Fix/
├── frontend/                 # 前端React应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   │   ├── common/         # 通用UI组件
│   │   │   ├── business/       # 业务组件
│   │   │   ├── layout/         # 布局组件
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── PublicRoute.tsx
│   │   ├── pages/          # 页面组件
│   │   │   ├── Home.tsx         # 首页
│   │   │   ├── Login.tsx        # 登录页
│   │   │   ├── Register.tsx     # 注册页
│   │   │   ├── Profile.tsx      # 个人中心
│   │   │   ├── CreateOrder.tsx  # 创建订单
│   │   │   ├── OrderList.tsx    # 订单列表
│   │   │   ├── OrderDetail.tsx  # 订单详情
│   │   │   ├── RepairRequest.tsx # 报修请求
│   │   │   ├── technician/      # 技师端页面
│   │   │   └── admin/           # 管理端页面
│   │   ├── router/         # 路由配置
│   │   ├── store/          # Zustand状态管理
│   │   │   ├── authStore.ts     # 认证状态
│   │   │   ├── orderStore.ts    # 订单状态
│   │   │   └── userStore.ts     # 用户状态
│   │   ├── utils/          # 工具函数
│   │   │   ├── axios.ts         # HTTP客户端配置
│   │   │   ├── constants.ts     # 常量定义
│   │   │   └── helpers.ts       # 辅助函数
│   │   ├── types/          # TypeScript类型定义
│   │   ├── hooks/          # 自定义React Hook
│   │   └── styles/         # 样式文件
│   ├── public/             # 静态资源
│   ├── package.json
│   ├── vite.config.ts      # Vite配置
│   └── tailwind.config.js  # Tailwind配置
├── backend/                 # 后端Express应用
│   ├── src/
│   │   ├── controllers/    # 控制器层
│   │   │   ├── authController.ts    # 认证控制器
│   │   │   ├── orderController.ts   # 订单控制器
│   │   │   ├── serviceController.ts # 服务控制器
│   │   │   ├── userController.ts    # 用户控制器
│   │   │   └── paymentController.ts # 支付控制器
│   │   ├── routes/         # 路由定义
│   │   │   ├── auth.ts         # 认证路由
│   │   │   ├── orders.ts       # 订单路由
│   │   │   ├── services.ts     # 服务路由
│   │   │   ├── users.ts        # 用户路由
│   │   │   └── payments.ts     # 支付路由
│   │   ├── middleware/     # 中间件
│   │   │   ├── auth.ts         # 认证中间件
│   │   │   ├── validation.ts   # 数据验证中间件
│   │   │   ├── rateLimit.ts    # 限流中间件
│   │   │   └── errorHandler.ts # 错误处理中间件
│   │   ├── services/       # 业务逻辑服务层
│   │   │   ├── authService.ts   # 认证服务
│   │   │   ├── orderService.ts  # 订单服务
│   │   │   ├── userService.ts   # 用户服务
│   │   │   └── notificationService.ts # 通知服务
│   │   ├── utils/          # 工具函数
│   │   │   ├── database.ts     # 数据库连接
│   │   │   ├── jwt.ts          # JWT工具
│   │   │   ├── response.ts     # 响应格式化
│   │   │   └── validation.ts   # 数据验证
│   │   ├── types/          # TypeScript类型定义
│   │   └── config/         # 配置文件
│   ├── package.json
│   └── tsconfig.json       # TypeScript配置
├── .trae/                  # 项目文档目录
│   └── documents/          # 生成的文档
│       ├── 产品需求文档.md
│       ├── 技术架构文档.md
│       ├── 开发指南.md
│       └── 开发文档.md
├── supabase/               # Supabase配置
│   ├── migrations/         # 数据库迁移文件
│   └── config.toml         # Supabase配置
├── docker-compose.yml      # Docker编排配置
├── .gitignore             # Git忽略文件
├── package.json           # 根目录依赖
└── README.md              # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git
- Supabase账号（用于数据库和认证服务）

### 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/your-username/XGX_Flash_Fix.git
   cd XGX_Flash_Fix
   ```
2. **安装依赖**

   ```bash
   # 安装根目录依赖
   npm install

   # 安装前端依赖
   cd frontend
   npm install

   # 安装后端依赖
   cd ../backend
   npm install
   ```
3. **Supabase配置**

   - 在 [Supabase](https://supabase.com) 创建新项目
   - 获取项目URL和API密钥
   - 运行数据库迁移文件（在Supabase SQL编辑器中执行 `supabase/migrations/` 下的SQL文件）
4. **环境配置**

   在 `backend` 目录下创建 `.env` 文件：

   ```env
   # 数据库配置
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT配置
   JWT_SECRET=your_jwt_secret_key

   # 服务器配置
   PORT=3001
   NODE_ENV=development

   # CORS配置
   FRONTEND_URL=http://localhost:5173
   ```
5. **启动服务**

   ```bash
   # 启动后端服务
   cd backend
   npm run dev

   # 启动前端服务（新终端）
   cd frontend
   npm run dev
   ```
6. **访问应用**

   - 前端应用：http://localhost:5173
   - 后端API：http://localhost:3001

### 默认账号

系统预置了以下测试账号：

- **管理员账号**：email: `admin@xgx.com`, password: `admin123`
- **财务人员账号**：email: `finance@xgx.com`, password: `finance123`
- **普通用户账号**：可通过注册页面自行创建

> 注意：生产环境部署时请务必修改默认密码以确保安全性。

## 最新开发进展

### 已完成功能

#### 用户认证系统 ✅

- 用户注册、登录、登出功能
- JWT token认证机制
- 角色权限控制（用户、技师、管理员、财务）
- 路由保护和权限验证

#### 订单管理系统 ✅

- 订单创建和提交
- 订单状态跟踪（待处理、已指派、进行中、已完成、已取消）
- 订单列表查看和筛选
- 订单详情页面（开发中）
- 技师指派功能

#### 管理后台 ✅

- 管理员仪表盘数据统计
- 用户管理（查看、编辑用户信息）
- 订单管理（查看、状态更新、技师指派）
- 服务项目管理
- 最近订单展示

#### 技师工作台 ✅

- 技师专用仪表盘
- 分配订单查看
- 订单状态更新

#### 响应式UI设计 ✅

- 基于Ant Design的现代化界面
- 移动端适配
- 暗色主题支持

### 最近修复的问题

#### 2025-01-08 修复记录

1. **订单指派接口错误** - 修正前端请求方法从POST改为PUT，与后端路由保持一致
2. **订单详情按钮无响应** - 添加正确的路由跳转功能
3. **仪表盘数据显示错误** - 修正字段映射，确保统计数据正确显示
4. **useNavigate未定义错误** - 添加缺失的React Router导入
5. **最近订单数据结构不匹配** - 修正订单号、客户名称、服务类型字段映射

### 当前开发状态

#### 功能完成度

- 🟢 **用户认证**: 100% 完成
- 🟢 **订单管理**: 90% 完成（详情页面待完善）
- 🟢 **管理后台**: 95% 完成
- 🟢 **技师工作台**: 85% 完成
- 🟡 **支付系统**: 30% 完成（基础架构）
- 🟡 **通知系统**: 20% 完成（基础架构）
- 🔴 **评价系统**: 10% 完成（数据库设计）

#### 已知问题

- 订单详情页面显示"此页面正在开发中..."占位符
- 支付功能尚未完全实现
- 实时通知功能待开发
- 文件上传功能需要完善

### 下一步开发计划

1. 完善订单详情页面功能
2. 实现支付系统集成
3. 开发实时通知功能
4. 添加订单评价系统
5. 完善文件上传和图片处理
6. 优化移动端用户体验

### 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

## API文档

### 基础信息

- 基础URL: `http://localhost:3001/api`
- 认证方式: Bearer Token (JWT)
- 响应格式: JSON

### 认证相关

#### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "用户名",
  "email": "用户邮箱",
  "phone": "手机号（可选）",
  "password": "密码",
  "role": "user" // user, technician, admin, finance
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "用户名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "用户邮箱",
  "password": "密码"
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "用户名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 用户管理

#### 获取用户列表（管理员）

```http
GET /api/users
Authorization: Bearer <token>
```

#### 更新用户信息

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "用户名",
  "email": "邮箱",
  "role": "用户角色"
}
```

### 服务管理

#### 获取服务列表

```http
GET /api/services
```

#### 创建服务（管理员）

```http
POST /api/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "服务名称",
  "description": "服务描述",
  "category": "服务分类",
  "basePrice": 100.00,
  "estimatedDuration": 60
}
```

### 订单相关

#### 创建订单

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "service_id": "服务ID",
  "device_model": "设备型号",
  "description": "问题描述",
  "images": ["图片URL1", "图片URL2"],
  "urgency": "normal", // normal, urgent, emergency
  "address": "联系地址",
  "contact_phone": "联系电话"
}
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "id": "order_uuid",
    "order_no": "XGX202501080001",
    "status": "pending",
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

#### 获取订单列表

```http
GET /api/orders?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

#### 获取订单详情

```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### 更新订单状态

```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "assigned", // pending, assigned, in_progress, completed, cancelled
  "notes": "状态更新备注",
  "technicianId": "技师ID（可选）"
}
```

#### 取消订单

```http
PUT /api/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "取消原因"
}
```

## 数据库设计

项目使用Supabase作为数据库服务，基于PostgreSQL。主要数据表结构如下：

### 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin', 'finance')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 服务项目表 (services)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('screen', 'battery', 'system', 'data', 'maintenance', 'software', 'water_damage')),
  base_price DECIMAL(10,2) NOT NULL,
  estimated_duration INTEGER, -- 预估时长（分钟）
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 订单表 (orders)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  device_model VARCHAR(100),
  description TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'emergency')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'paid', 'assigned', 'processing', 'completed', 'cancelled', 'refunded')),
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  assigned_to UUID REFERENCES users(id),
  address TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 订单状态历史表 (order_status_history)

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 支付记录表 (payments)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 评价记录表 (reviews)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 索引和约束

```sql
-- 创建索引提高查询性能
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_technician_id ON orders(technician_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 部署说明

### 生产环境部署

#### 1. 服务器要求

- Node.js >= 18.0.0
- PM2（进程管理器）
- Nginx（反向代理）
- SSL证书（HTTPS）

#### 2. 构建项目

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build
```

#### 3. 环境变量配置

生产环境 `.env` 配置：

```env
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
JWT_SECRET=your_strong_production_jwt_secret
PORT=3001
FRONTEND_URL=https://your-domain.com
```

#### 4. PM2部署配置

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'xgx-flash-fix-backend',
    script: './dist/index.js',
    cwd: './backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

#### 5. Nginx配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
  
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
  
    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
  
    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. 启动服务

```bash
# 使用PM2启动后端服务
pm2 start ecosystem.config.js

# 重启Nginx
sudo systemctl restart nginx
```

### 贡献者行为准则

- 尊重所有贡献者
- 提供建设性的反馈
- 遵循项目的代码规范
- 编写清晰的提交信息
- 添加必要的测试和文档

## 常见问题

### Q: 如何重置数据库？

A: 在Supabase控制台中重新运行迁移文件，或删除所有表后重新执行SQL脚本。

### Q: 前端无法连接后端API？

A: 检查CORS配置和环境变量中的URL设置。

### Q: 如何添加新的用户角色？

A: 修改数据库中users表的role字段约束，并更新相关的权限检查逻辑。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- **项目维护者**: JackWPP
- **技术支持**: jt846962421@gmail.com
- **项目地址**: [https://github.com/your-username/XGX_Flash_Fix](https://github.com/your-username/XGX_Flash_Fix)

---

**感谢使用新干线闪修平台！** 🚀

## 更新日志

### v1.0.0 (2025-08-08)

- 初始版本发布
- 实现基础的用户认证功能
- 实现订单管理功能
- 实现服务项目管理
- 集成Supabase数据库
- 响应式UI设计
