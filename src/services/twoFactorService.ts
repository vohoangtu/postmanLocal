/**
 * Two-Factor Authentication Service
 * Xử lý 2FA setup và verification
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
import { authService } from './authService';

export interface Enable2FAResponse {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}

export interface Verify2FARequest {
  code: string;
}

/**
 * Enable 2FA
 */
export async function enable2FA(): Promise<Enable2FAResponse> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/auth/2fa/enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể bật 2FA');
  }

  return response.json();
}

/**
 * Verify 2FA code và enable
 */
export async function verify2FA(code: string): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Mã xác thực không hợp lệ');
  }
}

/**
 * Disable 2FA
 */
export async function disable2FA(): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/auth/2fa/disable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tắt 2FA');
  }
}

/**
 * Generate recovery codes mới
 */
export async function generateRecoveryCodes(): Promise<string[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/auth/2fa/recovery-codes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể tạo recovery codes');
  }

  const data = await response.json();
  return data.recovery_codes;
}
