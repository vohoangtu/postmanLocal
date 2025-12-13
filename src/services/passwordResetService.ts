/**
 * Password Reset Service
 * Xử lý password reset flow
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  token?: string; // Chỉ có trong development
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể gửi yêu cầu reset password');
  }

  return response.json();
}

/**
 * Reset password với token
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Không thể reset password');
  }
}
