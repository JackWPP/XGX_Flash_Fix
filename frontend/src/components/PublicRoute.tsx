import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;