/**
 * Two-Factor Authentication Setup Component
 * Component để setup 2FA
 */

import { useState, useEffect } from 'react';
import { enable2FA, verify2FA } from '../../services/twoFactorService';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TwoFactorSetup({ onSuccess, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  useEffect(() => {
    if (step === 'setup') {
      handleEnable2FA();
    }
  }, [step]);

  const handleEnable2FA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await enable2FA();
      setSecret(response.secret);
      setQrCodeUrl(response.qr_code_url);
      setRecoveryCodes(response.recovery_codes);
    } catch (err: any) {
      setError(err.message || 'Không thể bật 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await verify2FA(code);
      setShowRecoveryCodes(true);
    } catch (err: any) {
      setError(err.message || 'Mã xác thực không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onSuccess?.();
  };

  if (showRecoveryCodes) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Recovery Codes
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Lưu các mã này ở nơi an toàn. Bạn có thể sử dụng chúng để đăng nhập nếu mất quyền truy cập vào ứng dụng xác thực.
        </p>

        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {recoveryCodes.map((code, index) => (
              <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded">
                {code}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleComplete}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Đã lưu, hoàn tất
        </button>
      </div>
    );
  }

  if (step === 'setup' && secret) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Thiết lập 2FA
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              1. Quét QR code bằng ứng dụng xác thực (Google Authenticator, Authy, etc.)
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
          </div>

          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              2. Hoặc nhập secret key thủ công:
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-sm break-all">
              {secret}
            </div>
          </div>

          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              3. Nhập mã xác thực 6 số từ ứng dụng:
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              setStep('verify');
            }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={code.length !== 6}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Xác thực
              </button>
            </form>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Hủy
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Xác thực 2FA
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Nhập mã 6 số từ ứng dụng xác thực:
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
            placeholder="000000"
            autoFocus
          />

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
            <button
              type="button"
              onClick={() => setStep('setup')}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Quay lại
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {loading ? (
        <div className="text-center">Đang tải...</div>
      ) : (
        <div>
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded mb-4">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
