# API接口文档

本文档详细描述了系统的所有API接口，包括请求方法、参数、响应格式等。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

## 认证相关

### 用户注册

```http
POST /auth/register
```

**请求参数**:
```json
{
  "name": "用户姓名",
  "email": "user@example.com",
  "password": "密码",
  "phone": "手机号码",
  "role": "user" // user | technician | admin
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "name": "用户姓名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token"
  }
}
```

### 用户登录

```http
POST /auth/login
```

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "密码"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "name": "用户姓名",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token"
  }
}
```

### 获取当前用户信息

```http
GET /auth/me
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "用户姓名",
    "email": "user@example.com",
    "phone": "手机号码",
    "role": "user",
    "created_at": "2025-01-08T00:00:00.000Z"
  }
}
```

## 用户管理

### 获取用户列表

```http
GET /users
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `role`: 用户角色筛选
- `search`: 搜索关键词

**请求头**:
```
Authorization: Bearer <admin_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "name": "用户姓名",
        "email": "user@example.com",
        "phone": "手机号码",
        "role": "user",
        "status": "active",
        "created_at": "2025-01-08T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 50,
      "per_page": 10
    }
  }
}
```

### 更新用户信息

```http
PUT /users/:id
```

**请求参数**:
```json
{
  "name": "新姓名",
  "phone": "新手机号",
  "status": "active" // active | inactive
}
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

## 服务管理

### 获取服务列表

```http
GET /services
```

**查询参数**:
- `category`: 服务分类
- `status`: 服务状态

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "服务名称",
      "description": "服务描述",
      "category": "服务分类",
      "base_price": 100.00,
      "duration": 60,
      "status": "active",
      "created_at": "2025-01-08T00:00:00.000Z"
    }
  ]
}
```

### 创建服务

```http
POST /services
```

**请求参数**:
```json
{
  "name": "服务名称",
  "description": "服务描述",
  "category": "服务分类",
  "base_price": 100.00,
  "duration": 60
}
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

### 更新服务

```http
PUT /services/:id
```

**请求参数**:
```json
{
  "name": "新服务名称",
  "description": "新服务描述",
  "base_price": 120.00,
  "status": "active"
}
```

### 删除服务

```http
DELETE /services/:id
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

## 订单管理

### 获取订单列表

```http
GET /orders
```

**查询参数**:
- `page`: 页码
- `limit`: 每页数量
- `status`: 订单状态
- `user_id`: 用户ID
- `technician_id`: 技师ID
- `start_date`: 开始日期
- `end_date`: 结束日期

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "order_number": "ORD20250108001",
        "user_id": "uuid",
        "service_id": "uuid",
        "technician_id": "uuid",
        "status": "pending",
        "scheduled_time": "2025-01-08T10:00:00.000Z",
        "address": "服务地址",
        "final_price": 100.00,
        "notes": "备注信息",
        "created_at": "2025-01-08T00:00:00.000Z",
        "users": {
          "name": "用户姓名",
          "phone": "手机号码"
        },
        "services": {
          "name": "服务名称",
          "category": "服务分类"
        },
        "technicians": {
          "name": "技师姓名",
          "phone": "技师电话"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_count": 100,
      "per_page": 10
    }
  }
}
```

### 创建订单

```http
POST /orders
```

**请求参数**:
```json
{
  "service_id": "uuid",
  "scheduled_time": "2025-01-08T10:00:00.000Z",
  "address": "服务地址",
  "notes": "备注信息"
}
```

**请求头**:
```
Authorization: Bearer <user_token>
```

### 获取订单详情

```http
GET /orders/:id
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD20250108001",
    "user_id": "uuid",
    "service_id": "uuid",
    "technician_id": "uuid",
    "status": "pending",
    "scheduled_time": "2025-01-08T10:00:00.000Z",
    "address": "服务地址",
    "final_price": 100.00,
    "notes": "备注信息",
    "created_at": "2025-01-08T00:00:00.000Z",
    "updated_at": "2025-01-08T00:00:00.000Z",
    "users": {
      "name": "用户姓名",
      "phone": "手机号码",
      "email": "user@example.com"
    },
    "services": {
      "name": "服务名称",
      "description": "服务描述",
      "category": "服务分类",
      "base_price": 100.00,
      "duration": 60
    },
    "technicians": {
      "name": "技师姓名",
      "phone": "技师电话",
      "specialties": ["专业技能"]
    }
  }
}
```

### 指派技师

```http
PUT /orders/:id/assign
```

**请求参数**:
```json
{
  "technician_id": "uuid"
}
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

### 更新订单状态

```http
PUT /orders/:id/status
```

**请求参数**:
```json
{
  "status": "in_progress", // pending | confirmed | in_progress | completed | cancelled
  "notes": "状态更新备注"
}
```

**请求头**:
```
Authorization: Bearer <token>
```

## 技师管理

### 获取技师列表

```http
GET /technicians
```

**查询参数**:
- `status`: 技师状态
- `specialties`: 专业技能
- `available`: 是否可用

**请求头**:
```
Authorization: Bearer <admin_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "specialties": ["专业技能1", "专业技能2"],
      "experience_years": 5,
      "rating": 4.8,
      "status": "active",
      "is_available": true,
      "created_at": "2025-01-08T00:00:00.000Z",
      "users": {
        "name": "技师姓名",
        "phone": "技师电话",
        "email": "technician@example.com"
      }
    }
  ]
}
```

### 更新技师信息

```http
PUT /technicians/:id
```

**请求参数**:
```json
{
  "specialties": ["新专业技能"],
  "experience_years": 6,
  "status": "active",
  "is_available": true
}
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

## 统计数据

### 获取仪表盘统计

```http
GET /dashboard/stats
```

**请求头**:
```
Authorization: Bearer <admin_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "total_technicians": 25,
    "total_orders": 500,
    "total_revenue": 50000.00,
    "pending_orders": 10,
    "completed_orders": 450,
    "active_technicians": 20,
    "monthly_revenue": 8000.00,
    "recent_orders": [
      {
        "id": "uuid",
        "order_number": "ORD20250108001",
        "status": "pending",
        "final_price": 100.00,
        "created_at": "2025-01-08T00:00:00.000Z",
        "users": {
          "name": "用户姓名"
        },
        "services": {
          "name": "服务名称"
        }
      }
    ]
  }
}
```

## 错误响应格式

所有API在发生错误时都会返回统一的错误格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}
```

### 常见错误码

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未授权，需要登录
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `422 Unprocessable Entity`: 数据验证失败
- `500 Internal Server Error`: 服务器内部错误

## 状态码说明

### 订单状态
- `pending`: 待确认
- `confirmed`: 已确认
- `in_progress`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消

### 用户状态
- `active`: 活跃
- `inactive`: 非活跃
- `suspended`: 已暂停

### 技师状态
- `active`: 活跃
- `inactive`: 非活跃
- `busy`: 忙碌中

### 服务状态
- `active`: 可用
- `inactive`: 不可用
- `maintenance`: 维护中

## 分页参数

所有列表接口都支持分页，使用以下参数：
- `page`: 页码，从1开始
- `limit`: 每页数量，默认10，最大100

分页响应格式：
```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_count": 100,
    "per_page": 10,
    "has_next": true,
    "has_prev": false
  }
}
```

## 请求限制

- 每个IP每分钟最多100次请求
- 上传文件大小限制：10MB
- 请求超时时间：30秒

## 版本控制

当前API版本：v1

未来版本更新时，会在URL中包含版本号：
- v1: `/api/...`
- v2: `/api/v2/...`