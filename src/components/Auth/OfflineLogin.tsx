/**
 * Offline Login Component
 * Component để login offline khi không có internet
 */

import { useState, useEffect } from 'react';
import { WifiOff, Lock } from 'lucide-react';
import { offlineAuthService } from '../../services/offlineAuthService';
import { authService } from '../../services/authService';
import { roleService } from '../../services/roleService';

interface OfflineLoginProps {
  onSuccess?: () => void;
}

export default function OfflineLogin({ onSuccess }: OfflineLoginProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOfflineAuth, setHasOfflineAuth] = useState(false);

  useEffect(() => {
    checkOfflineAuth();
  }, []);

  const checkOfflineAuth = async () => {
    const hasAuth = await offlineAuthService.checkOfflineAuth();
    setHasOfflineAuth(hasAuth);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await offlineAuthService.offlineLogin(password);

      if (result.authenticated) {
        // Save user data locally
        await authService.saveUser(result.user);
        roleService.setUser(result.user);

        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập offline thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!hasOfflineAuth) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <WifiOff className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Không có Offline Mode
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bạn cần enable offline mode khi có internet để sử dụng tính năng này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <WifiOff className="mx-auto text-orange-400 mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Offline Mode
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Đăng nhập với credentials đã lưu
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Lock className="inline mr-2" size={16} />
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Nhập password để đăng nhập offline"
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập Offline'}
        </button>
      </form>
    </div>
  );
}
