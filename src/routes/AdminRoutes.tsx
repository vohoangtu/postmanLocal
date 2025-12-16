/**
 * Admin Routes
 * Routes cho admin panel với protected routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import Dashboard from '../components/Admin/Dashboard';
import UserManagement from '../components/Admin/UserManagement';
import UserDetail from '../components/Admin/UserDetail';
import SecurityLogs from '../components/Admin/SecurityLogs';

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="security-logs" element={<SecurityLogs />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}
