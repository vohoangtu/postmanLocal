/**
 * User Preferences Settings Component
 * Settings: theme (light/dark), language, notifications, etc.
 */

import { useState, useEffect } from 'react';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';

export default function PreferencesSettings() {
  const { preferences, loadPreferences, updatePreferences } = useUserPreferencesStore();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updatePreferences(localPreferences);
      setMessage('Preferences đã được cập nhật');
    } catch (error: any) {
      setMessage(error.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Preferences
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tùy chỉnh cài đặt của bạn
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 space-y-6">
        {/* Theme */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <select
            value={localPreferences.theme || 'auto'}
            onChange={(e) => setLocalPreferences({ ...localPreferences, theme: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <select
            value={localPreferences.language || 'vi'}
            onChange={(e) => setLocalPreferences({ ...localPreferences, language: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Notifications
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localPreferences.notifications?.email ?? true}
                onChange={(e) => setLocalPreferences({
                  ...localPreferences,
                  notifications: {
                    ...localPreferences.notifications,
                    email: e.target.checked,
                  },
                })}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localPreferences.notifications?.push ?? true}
                onChange={(e) => setLocalPreferences({
                  ...localPreferences,
                  notifications: {
                    ...localPreferences.notifications,
                    push: e.target.checked,
                  },
                })}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Push notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localPreferences.notifications?.comments ?? true}
                onChange={(e) => setLocalPreferences({
                  ...localPreferences,
                  notifications: {
                    ...localPreferences.notifications,
                    comments: e.target.checked,
                  },
                })}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Comments notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={localPreferences.notifications?.shares ?? true}
                onChange={(e) => setLocalPreferences({
                  ...localPreferences,
                  notifications: {
                    ...localPreferences.notifications,
                    shares: e.target.checked,
                  },
                })}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">Shares notifications</span>
            </label>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded ${
            message.includes('đã được') 
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu preferences'}
        </button>
      </div>
    </div>
  );
}
