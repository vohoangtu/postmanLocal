/**
 * Personalized Welcome Component
 * Welcome screen sau login với personalized content
 */

import { useEffect, useState } from 'react';
import { Clock, Activity, FileText } from 'lucide-react';
import { authService } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface WelcomeProps {
  onContinue: () => void;
}

export default function PersonalizedWelcome({ onContinue }: WelcomeProps) {
  const [user, setUser] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWelcomeData();
  }, []);

  const loadWelcomeData = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);

      // Load recent activity (if available)
      const token = await authService.getAccessToken();
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/activities?limit=5`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setRecentActivity(data.data || []);
          }
        } catch {
          // Ignore activity load errors
        }
      }
    } catch (error) {
      console.error('Error loading welcome data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {greeting()}, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Chào mừng bạn quay trở lại PostmanLocal
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-blue-600 dark:text-blue-400" size={20} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Quick Start</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tạo request mới để bắt đầu test API
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-green-600 dark:text-green-400" size={20} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {recentActivity.length} hoạt động gần đây
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-purple-600 dark:text-purple-400" size={20} />
              <h3 className="font-semibold text-gray-900 dark:text-white">Last Login</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {recentActivity.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.description || activity.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
