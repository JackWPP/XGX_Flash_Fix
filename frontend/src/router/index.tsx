import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import CreateOrder from '../pages/CreateOrder';
import OrderList from '../pages/OrderList';
import RepairRequest from '../pages/RepairRequest';
import Profile from '../pages/Profile';
import AdminDashboard from '../pages/AdminDashboard';
import AdminLayout from '../components/layout/AdminLayout';
import UserManagement from '../pages/admin/UserManagement';
import OrderManagement from '../pages/admin/OrderManagement';
import ServiceManagement from '../pages/admin/ServiceManagement';

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <UserManagement /> },
      { path: 'orders', element: <OrderManagement /> },
      { path: 'services', element: <ServiceManagement /> },
    ]
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: '/order/create',
    element: (
      <ProtectedRoute>
        <CreateOrder />
      </ProtectedRoute>
    )
  },
  {
    path: '/order/list',
    element: (
      <ProtectedRoute>
        <OrderList />
      </ProtectedRoute>
    )
  },
  {
    path: '/repair/request',
    element: (
      <ProtectedRoute>
        <RepairRequest />
      </ProtectedRoute>
    )
  },
  {
    path: '/order/detail/:id',
    element: (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">订单详情页</h2>
            <p className="text-gray-600">此页面正在开发中...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  },
  {
    path: '/order/search',
    element: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">订单搜索页</h2>
          <p className="text-gray-600">此页面正在开发中...</p>
        </div>
      </div>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    )
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    )
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">页面未找到</h2>
          <p className="text-gray-600 mb-8">抱歉，您访问的页面不存在</p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    )
  }
]);