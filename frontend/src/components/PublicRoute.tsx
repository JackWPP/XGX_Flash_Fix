import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token, user } = useAuthStore();

  if (token && user) {
    // 已登录用户根据角色跳转到默认首页
    if (user.role === 'admin' || user.role === 'service' || user.role === 'finance') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'technician') {
      return <Navigate to="/technician/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;