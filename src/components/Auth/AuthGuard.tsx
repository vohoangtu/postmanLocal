/**
 * Auth Guard Component
 * Wrapper để check authentication trước khi render children
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import OfflineLogin from './OfflineLogin';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { canUseOfflineMode } = useOfflineMode();
  const [showOfflineLogin, setShowOfflineLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      if (canUseOfflineMode) {
        setShowOfflineLogin(true);
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, canUseOfflineMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    if (showOfflineLogin) {
      return (
        <OfflineLogin
          onSuccess={() => {
            setShowOfflineLogin(false);
            navigate('/');
          }}
        />
      );
    }
    return <Login onSuccess={() => navigate('/')} />;
  }

  if (requireAdmin && user && user.role !== 'admin' && user.role !== 'super_admin') {
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

  return <>{children}</>;
}
