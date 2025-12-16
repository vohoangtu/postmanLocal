/**
 * Protected Route Component
 * Bảo vệ routes yêu cầu authentication
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRole?: 'admin' | 'super_admin';
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin) {
    if (!user || (!user.role || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Không có quyền truy cập
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Bạn cần quyền admin để truy cập trang này.
            </p>
          </div>
        </div>
      );
    }
  }

  if (requireRole && user && user.role !== requireRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Không có quyền truy cập
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bạn cần quyền {requireRole} để truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
