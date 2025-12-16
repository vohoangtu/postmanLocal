/**
 * Admin User Detail Component
 * Chi tiết user: info, security logs, activity
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Key } from 'lucide-react';
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
  security_logs?: Array<{
    id: number;
    event_type: string;
    ip_address: string;
    created_at: string;
    metadata: any;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!user) {
    return <div className="text-center py-8">Không tìm thấy user</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chi tiết User
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Thông tin User
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Tên</label>
              <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
              <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Role</label>
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
              <div className="mt-1">
                <StatusBadge locked={!!user.locked_until} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">2FA</label>
              <p className="text-gray-900 dark:text-white">
                {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Ngày tạo</label>
              <p className="text-gray-900 dark:text-white">
                {new Date(user.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Security Logs */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Security Logs
          </h2>
          {user.security_logs && user.security_logs.length > 0 ? (
            <div className="space-y-2">
              {user.security_logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {log.event_type}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.ip_address}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Không có logs</p>
          )}
        </div>
      </div>
    </div>
  );
}
