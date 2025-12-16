/**
 * Token File Login Component
 * Component để đăng nhập bằng token file với file input và drag & drop
 */

import { useState, useRef, DragEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { uploadTokenFile, validateTokenFile } from '../../services/tokenFileService';
import { generateDeviceFingerprintAsync } from '../../services/deviceFingerprintService';
import { useAuth } from '../../contexts/AuthContext';

interface TokenFileLoginProps {
  onSwitchToPassword?: () => void;
}

export default function TokenFileLogin({ onSwitchToPassword }: TokenFileLoginProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Validate file
    const validation = validateTokenFile(file);
    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogin = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn token file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate device fingerprint
      const deviceFingerprint = await generateDeviceFingerprintAsync();

      // Upload và login
      const response = await uploadTokenFile(selectedFile, deviceFingerprint);

      // Save tokens và user info trực tiếp
      const { authService } = await import('../../services/authService');
      await authService.saveTokens({
        accessToken: response.token,
        refreshToken: response.refresh_token,
        expiresAt: response.expires_at ? new Date(response.expires_at).getTime() : undefined,
      });
      await authService.saveUser(response.user);
      
      // Update auth context
      const { roleService } = await import('../../services/roleService');
      roleService.setUser(response.user);
      
      // Refresh auth context
      window.location.reload(); // Simple way to refresh auth context

      // Redirect
      if (response.user.role === 'admin' || response.user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Đăng nhập
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onSwitchToPassword}
          className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Email & Password
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition-colors"
        >
          Token File
        </button>
      </div>

      <div className="space-y-4">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          {selectedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="text-blue-600 dark:text-blue-400" size={24} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Xóa file"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Kéo thả token file vào đây hoặc
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                Chọn file
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={!selectedFile || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập với Token File'}
        </button>

        {/* Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Token file được tạo bởi admin và chỉ có thể sử dụng trên một device.
        </div>
      </div>
    </div>
  );
}
