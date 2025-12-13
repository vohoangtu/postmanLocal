/**
 * Two-Factor Authentication Verify Component
 * Component để verify 2FA khi login
 */

import { useState } from 'react';

interface TwoFactorVerifyProps {
  onSubmit: (code: string) => Promise<void>;
  onCancel?: () => void;
}

export default function TwoFactorVerify({ onSubmit, onCancel }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError('Mã xác thực phải có 6 số');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(code);
    } catch (err: any) {
      setError(err.message || 'Mã xác thực không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Xác thực 2FA
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Nhập mã 6 số từ ứng dụng xác thực của bạn:
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
          placeholder="000000"
          autoFocus
        />

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hoặc sử dụng recovery code nếu bạn không có quyền truy cập vào ứng dụng xác thực.
        </p>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
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
