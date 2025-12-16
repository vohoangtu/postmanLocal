/**
 * Token File Service
 * Xử lý upload và validate token files
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface TokenFileLoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role?: 'user' | 'admin' | 'super_admin';
  };
  token: string;
  refresh_token: string;
  expires_at: string;
  preferences?: any;
}

/**
 * Validate token file format
 */
export function validateTokenFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.includes('json') && !file.name.endsWith('.json')) {
    return {
      valid: false,
      error: 'File phải là định dạng JSON',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File quá lớn. Kích thước tối đa là 10MB',
    };
  }

  return { valid: true };
}

/**
 * Upload token file và đăng nhập
 */
export async function uploadTokenFile(
  file: File,
  deviceFingerprint: string
): Promise<TokenFileLoginResponse> {
  // Validate file
  const validation = validateTokenFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File không hợp lệ');
  }

  // Tạo FormData
  const formData = new FormData();
  formData.append('token_file', file);
  formData.append('device_fingerprint', deviceFingerprint);

  // Upload file
  const response = await fetch(`${API_BASE_URL}/auth/login-with-token-file`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || data.errors?.token_file?.[0] || 'Đăng nhập thất bại';
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Read token file content (for preview/validation)
 */
export async function readTokenFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        resolve(content);
      } catch (error) {
        reject(new Error('Không thể đọc file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'));
    };
    
    reader.readAsText(file);
  });
}
