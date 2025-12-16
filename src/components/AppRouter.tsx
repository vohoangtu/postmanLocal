/**
 * App Router Component
 * Quản lý routing cho toàn bộ app với authentication
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from './Auth/AuthGuard';
import ProtectedRoute from './Auth/ProtectedRoute';
import MainApp from './MainApp';

// Lazy load components
const AdminRoutes = lazy(() => import('../routes/AdminRoutes'));
const UserPanel = lazy(() => import('./User/UserPanel'));
const Login = lazy(() => import('./Auth/Login'));
const Register = lazy(() => import('./Auth/Register'));
const TokenFileLogin = lazy(() => import('./Auth/TokenFileLogin'));
const PersonalizedWelcome = lazy(() => import('./Auth/PersonalizedWelcome'));

export default function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
              <Login />
            </Suspense>
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
              <Register />
            </Suspense>
          )
        }
      />
      <Route
        path="/login/token-file"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
              <TokenFileLogin />
            </Suspense>
          )
        }
      />

      {/* Main app - yêu cầu đăng nhập */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải admin panel...</div>}>
              <AdminRoutes />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* User panel routes */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
              <UserPanel />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Welcome route (optional, có thể redirect sau login) */}
      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Đang tải...</div>}>
              <PersonalizedWelcome onContinue={() => window.location.href = '/'} />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
