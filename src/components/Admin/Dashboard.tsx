/**
 * Admin Dashboard Component
 * Dashboard với stats cards, charts, recent activity
 */

import { useEffect, useState } from 'react';
import { Users, Shield, Lock, UserCheck, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total_users: number;
  active_users: number;
  locked_users: number;
  admin_users: number;
  regular_users: number;
  users_with_2fa: number;
  security_events_today: number;
  security_events_week: number;
  security_events_month: number;
  failed_logins_today: number;
  account_lockouts_today: number;
}

interface DashboardData {
  stats: DashboardStats;
  user_growth: Array<{ date: string; count: number }>;
  events_by_type: Array<{ event_type: string; count: number }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await (await import('../../services/authService')).authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;

  const statCards = [
    {
      title: 'Tổng Users',
      value: stats.total_users,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Users',
      value: stats.active_users,
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'Locked Users',
      value: stats.locked_users,
      icon: Lock,
      color: 'red',
    },
    {
      title: 'Admin Users',
      value: stats.admin_users,
      icon: Shield,
      color: 'purple',
    },
    {
      title: 'Security Events (Today)',
      value: stats.security_events_today,
      icon: AlertTriangle,
      color: 'orange',
    },
    {
      title: 'Failed Logins (Today)',
      value: stats.failed_logins_today,
      icon: TrendingUp,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tổng quan về hệ thống và users
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-${card.color}-100 dark:bg-${card.color}-900`}>
                  <Icon className={`text-${card.color}-600 dark:text-${card.color}-400`} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Security Events by Type (7 days)
          </h2>
          <div className="space-y-2">
            {data.events_by_type.map((event) => (
              <div key={event.event_type} className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">{event.event_type}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {event.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            User Statistics
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Regular Users</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.regular_users}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Users with 2FA</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.users_with_2fa}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Account Lockouts (Today)</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats.account_lockouts_today}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
