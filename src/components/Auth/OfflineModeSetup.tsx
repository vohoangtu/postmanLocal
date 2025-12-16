/**
 * Offline Mode Setup Component
 * Setup offline mode trong settings
 */

import { useState } from 'react';
import { WifiOff, Shield } from 'lucide-react';
import { offlineAuthService } from '../../services/offlineAuthService';
import { authService } from '../../services/authService';

interface OfflineModeSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OfflineModeSetup({ onSuccess, onCancel }: OfflineModeSetupProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);

    try {
      const user = await authService.getUser();
      if (!user) {
        throw new Error('Chưa đăng nhập');
      }

      await offlineAuthService.enableOfflineMode(
        user.email || '',
        password,
        user
      );

      setMessage('Offline mode đã được enable thành công');
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể enable offline mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <Shield className="mx-auto text-blue-400 mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Enable Offline Mode
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Cho phép đăng nhập khi không có internet
        </p>
      </div>

      <form onSubmit={handleSetup} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Password để bảo vệ offline credentials
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Nhập password"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Xác nhận password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Xác nhận password"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
            {message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang setup...' : 'Enable Offline Mode'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
