/**
 * Admin User Management Component
 * Table với users, filters, search, actions
 */

import { useEffect, useState } from 'react';
import { Search, Lock, Unlock, Trash2, Edit, Eye, Key, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import RoleBadge from '../UI/RoleBadge';
import StatusBadge from '../UI/StatusBadge';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  locked_until: string | null;
  two_factor_enabled: boolean;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [lockedFilter, setLockedFilter] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, lockedFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (lockedFilter) params.append('locked', lockedFilter);

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (err: any) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async (userId: number) => {
    if (!confirm('Bạn có chắc muốn khóa tài khoản này?')) return;

    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes: 15 }),
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('Error locking user:', err);
    }
  };

  const handleUnlock = async (userId: number) => {
    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('Error unlocking user:', err);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Nhập password mới (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số):');
    if (!newPassword) return;

    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        alert('Password đã được reset');
      } else {
        const error = await response.json();
        alert(error.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Bạn có chắc muốn xóa user này? Hành động này không thể hoàn tác.')) return;

    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleDownloadToken = async (userId: number) => {
    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/generate-token-file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Không thể tạo token file');
      }

      const data = await response.json();
      
      // Tạo Blob và download file
      const blob = new Blob([data.file_content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Hiển thị toast success (nếu có toast service)
      alert('Token file đã được tải xuống thành công!');
    } catch (err: any) {
      console.error('Error downloading token:', err);
      alert(err.message || 'Không thể tải token file');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Quản lý Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý tất cả users trong hệ thống
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tất cả Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <select
            value={lockedFilter}
            onChange={(e) => setLockedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tất cả Status</option>
            <option value="true">Locked</option>
            <option value="false">Active</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    2FA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge locked={!!user.locked_until} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.two_factor_enabled ? (
                        <span className="text-green-600 dark:text-green-400">Enabled</span>
                      ) : (
                        <span className="text-gray-400">Disabled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        {user.locked_until ? (
                          <button
                            onClick={() => handleUnlock(user.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Unlock"
                          >
                            <Unlock size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLock(user.id)}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                            title="Lock"
                          >
                            <Lock size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          title="Reset Password"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadToken(user.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          title="Download Token File"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
