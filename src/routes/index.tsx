/**
 * Centralized Routing Configuration
 * Quản lý tất cả routes cho app
 */

import { lazy } from 'react';

// Lazy load routes
export const AdminRoutes = lazy(() => import('./AdminRoutes'));

// Route paths
export const ROUTES = {
  HOME: '/',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_SECURITY_LOGS: '/admin/security-logs',
  USER_PANEL: '/user',
  LOGIN: '/login',
} as const;
