import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Memverifikasi Sesi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectUrl}`} replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard based on role
    let targetPath = '/';
    switch (user.role) {
      case 'super_admin':
        targetPath = '/dashboard/super-admin';
        break;
      case 'owner':
        targetPath = '/dashboard/owner';
        break;
      case 'admin':
        targetPath = '/dashboard/admin-sistem';
        break;
      case 'customer':
        targetPath = '/dashboard/customer';
        break;
    }
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
