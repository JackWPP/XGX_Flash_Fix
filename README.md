# 新干线闪修平台

一个现代化的手机维修服务平台，提供便捷的在线下单、维修跟踪和服务管理功能。

## 项目概述

新干线闪修平台是一个全栈Web应用，旨在为用户提供高效、透明的手机维修服务。平台支持用户在线下单、实时跟踪维修进度、在线支付等功能。

### 主要功能

- **用户端功能**
  - 用户注册/登录
  - 在线下单维修服务
  - 订单状态跟踪
  - 在线支付
  - 服务评价

- **技师端功能**
  - 接单管理
  - 维修进度更新
  - 价格报价
  - 客户沟通

- **管理端功能**
  - 订单管理
  - 用户管理
  - 服务项目管理
  - 数据统计

## 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的JavaScript
- **Ant Design** - UI组件库
- **React Router** - 路由管理
- **Zustand** - 状态管理
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **TypeScript** - 类型安全的JavaScript
- **Supabase** - 数据库和认证服务
- **JWT** - 身份验证

## 项目结构

```
XGX_Flash_Fix/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # 状态管理
│   │   ├── types/          # TypeScript类型定义
│   │   ├── utils/          # 工具函数
│   │   └── router/         # 路由配置
│   ├── public/             # 静态资源
│   └── package.json        # 前端依赖
├── backend/                 # 后端应用
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型定义
│   └── package.json        # 后端依赖
├── docs/                   # 项目文档
│   ├── 产品需求文档.md
│   └── 技术架构文档.md
└── README.md               # 项目说明
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 环境配置

1. 在后端目录创建 `.env` 文件：

```env
# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT配置
JWT_SECRET=your_jwt_secret

# 服务器配置
PORT=3001
```

### 启动开发服务器

```bash
# 启动后端服务器 (端口: 3001)
cd backend
npm run dev

# 启动前端开发服务器 (端口: 5173)
cd frontend
npm run dev
```

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

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/logout` - 用户登出

### 订单管理
- `GET /api/v1/orders` - 获取订单列表
- `POST /api/v1/orders` - 创建新订单
- `GET /api/v1/orders/:id` - 获取订单详情
- `PUT /api/v1/orders/:id/status` - 更新订单状态

### 服务管理
- `GET /api/v1/services` - 获取服务列表
- `GET /api/v1/services/:id` - 获取服务详情

## 数据库设计

项目使用Supabase作为数据库服务，主要数据表包括：

- `users` - 用户信息表
- `orders` - 订单信息表
- `services` - 服务项目表
- `payments` - 支付记录表
- `reviews` - 评价记录表

## 部署说明

### 前端部署

推荐使用Vercel或Netlify进行前端部署：

```bash
# 构建前端
npm run build

# 部署到Vercel
vercel --prod
```

### 后端部署

可以部署到Railway、Heroku或其他Node.js托管平台。

## 开发规范

### 代码风格
- 使用ESLint和Prettier进行代码格式化
- 遵循TypeScript严格模式
- 使用语义化的变量和函数命名

### Git提交规范
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关

## 贡献指南

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-username/XGX_Flash_Fix/issues)
- 邮箱: your-email@example.com

## 更新日志

### v1.0.0 (2025-01-08)
- 初始版本发布
- 实现基础的用户认证功能
- 实现订单管理功能
- 实现服务项目管理
- 集成Supabase数据库
- 响应式UI设计