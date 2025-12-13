/**
 * Authentication Service
 * Quản lý authentication, token refresh, và secure storage
 */

import { IS_TAURI } from '../utils/platform';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Secure storage interface
 */
interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Secure storage implementation
 */
class SecureStorageImpl implements SecureStorage {
  async getItem(key: string): Promise<string | null> {
    if (IS_TAURI) {
      // Sử dụng Tauri secure storage
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        return await invoke<string | null>('get_secure_storage', { key });
      } catch {
        // Fallback to localStorage nếu Tauri API không available
        return localStorage.getItem(key);
      }
    }
    // Web: sử dụng localStorage (có thể upgrade sang encrypted storage sau)
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (IS_TAURI) {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        await invoke('set_secure_storage', { key, value });
        return;
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (IS_TAURI) {
      const { invoke } = await import('@tauri-apps/api/core');
      try {
        await invoke('remove_secure_storage', { key });
        return;
      } catch {
        // Fallback
      }
    }
    localStorage.removeItem(key);
  }
}

const secureStorage = new SecureStorageImpl();

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const TOKEN_EXPIRY_KEY = 'token_expires_at';

class AuthService {
  private refreshTokenPromise: Promise<AuthTokens> | null = null;

  /**
   * Lưu tokens vào secure storage (với encryption)
   */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    // Import encryption service
    const { encryptionService } = await import('./encryptionService');
    
    // Encrypt tokens trước khi lưu
    const encryptedAccessToken = await encryptionService.encrypt(tokens.accessToken, 'auth_token');
    await secureStorage.setItem(TOKEN_KEY, encryptedAccessToken);
    
    if (tokens.refreshToken) {
      const encryptedRefreshToken = await encryptionService.encrypt(tokens.refreshToken, 'refresh_token');
      await secureStorage.setItem(REFRESH_TOKEN_KEY, encryptedRefreshToken);
    }
    
    if (tokens.expiresAt) {
      await secureStorage.setItem(TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
    }
  }

  /**
   * Lấy access token (với decryption)
   */
  async getAccessToken(): Promise<string | null> {
    const encrypted = await secureStorage.getItem(TOKEN_KEY);
    if (!encrypted) return null;
    
    try {
      const { encryptionService } = await import('./encryptionService');
      return await encryptionService.decrypt(encrypted, 'auth_token');
    } catch {
      // Fallback: có thể là token cũ chưa được encrypt
      return encrypted;
    }
  }

  /**
   * Lấy refresh token (với decryption)
   */
  async getRefreshToken(): Promise<string | null> {
    const encrypted = await secureStorage.getItem(REFRESH_TOKEN_KEY);
    if (!encrypted) return null;
    
    try {
      const { encryptionService } = await import('./encryptionService');
      return await encryptionService.decrypt(encrypted, 'refresh_token');
    } catch {
      // Fallback: có thể là token cũ chưa được encrypt
      return encrypted;
    }
  }

  /**
   * Kiểm tra token có hết hạn không
   */
  async isTokenExpired(): Promise<boolean> {
    const expiresAt = await secureStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiresAt) return false; // Không có expiry info, assume valid
    
    const expiryTime = parseInt(expiresAt, 10);
    const now = Date.now();
    
    // Refresh nếu còn < 5 phút
    return now >= (expiryTime - 5 * 60 * 1000);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this._doRefreshToken();
    
    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async _doRefreshToken(): Promise<AuthTokens> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token invalid, clear all tokens
      await this.clearTokens();
      throw new Error('Refresh token invalid');
    }

    const data = await response.json();
    const tokens: AuthTokens = {
      accessToken: data.token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
    };

    await this.saveTokens(tokens);
    return tokens;
  }

  /**
   * Lưu user info
   */
  async saveUser(user: User): Promise<void> {
    await secureStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Lấy user info
   */
  async getUser(): Promise<User | null> {
    const userStr = await secureStorage.getItem(USER_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  /**
   * Xóa tất cả auth data
   */
  async clearTokens(): Promise<void> {
    await Promise.all([
      secureStorage.removeItem(TOKEN_KEY),
      secureStorage.removeItem(REFRESH_TOKEN_KEY),
      secureStorage.removeItem(USER_KEY),
      secureStorage.removeItem(TOKEN_EXPIRY_KEY),
    ]);
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;
    
    // Check if token is expired
    if (await this.isTokenExpired()) {
      try {
        await this.refreshAccessToken();
        return true;
      } catch {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Revoke tất cả tokens
   */
  async revokeAllTokens(): Promise<void> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Chưa đăng nhập');
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const response = await fetch(`${API_BASE_URL}/auth/revoke-all-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Không thể revoke tokens');
    }

    // Clear local tokens
    await this.clearTokens();
  }
}

export const authService = new AuthService();
