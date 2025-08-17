import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type UserRole = 'user' | 'technician' | 'admin' | 'service' | 'finance';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
  // 如果用户未认证，根据当前路径重定向到相应登录页
  const path = location.pathname;
  const to = path.startsWith('/admin') || path.startsWith('/technician') ? '/admin/login' : '/login';
  return <Navigate to={to} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // 如果用户角色不在允许列表中，重定向到无权限页面或首页
    // 这里我们简单重定向到首页
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;