/**
 * Offline Authentication Service
 * Handle offline authentication với local storage
 */

import { IS_TAURI } from '../utils/platform';
import { encryptionService } from './encryptionService';

interface OfflineCredentials {
  email: string;
  encryptedPassword: string;
  userData: any;
  timestamp: number;
}

const OFFLINE_AUTH_KEY = 'offline_auth';
const OFFLINE_DATA_KEY = 'offline_data';

/**
 * Offline Auth Service
 */
class OfflineAuthService {
  /**
   * Enable offline mode và lưu credentials
   */
  async enableOfflineMode(email: string, password: string, userData: any): Promise<void> {
    if (!IS_TAURI) {
      throw new Error('Offline mode chỉ có sẵn trong Desktop app');
    }

    try {
      // Encrypt password
      const encryptedPassword = await encryptionService.encrypt(password, 'offline_auth');

      const credentials: OfflineCredentials = {
        email,
        encryptedPassword,
        userData,
        timestamp: Date.now(),
      };

      // Lưu vào Tauri secure storage
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('save_offline_auth', {
        credentials: JSON.stringify(credentials),
      });
    } catch (error) {
      console.error('Error enabling offline mode:', error);
      throw new Error('Không thể enable offline mode');
    }
  }

  /**
   * Login với offline credentials
   */
  async offlineLogin(password: string): Promise<{ user: any; authenticated: boolean }> {
    if (!IS_TAURI) {
      throw new Error('Offline mode chỉ có sẵn trong Desktop app');
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const credentialsStr = await invoke<string>('load_offline_auth');

      if (!credentialsStr) {
        throw new Error('Không tìm thấy offline credentials');
      }

      const credentials: OfflineCredentials = JSON.parse(credentialsStr);

      // Verify password
      const decryptedPassword = await encryptionService.decrypt(
        credentials.encryptedPassword,
        'offline_auth'
      );

      if (decryptedPassword !== password) {
        throw new Error('Mật khẩu không đúng');
      }

      return {
        user: credentials.userData,
        authenticated: true,
      };
    } catch (error: any) {
      console.error('Error offline login:', error);
      throw new Error(error.message || 'Offline login thất bại');
    }
  }

  /**
   * Check nếu có offline auth
   */
  async checkOfflineAuth(): Promise<boolean> {
    if (!IS_TAURI) {
      return false;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const credentials = await invoke<string | null>('load_offline_auth');
      return !!credentials;
    } catch {
      return false;
    }
  }

  /**
   * Clear offline auth
   */
  async clearOfflineAuth(): Promise<void> {
    if (!IS_TAURI) {
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('clear_offline_auth');
    } catch (error) {
      console.error('Error clearing offline auth:', error);
    }
  }

  /**
   * Sync data khi online
   */
  async syncWhenOnline(): Promise<void> {
    if (!IS_TAURI) {
      return;
    }

    try {
      // Check if online
      const online = navigator.onLine;
      if (!online) {
        return;
      }

      // Load offline data
      const { invoke } = await import('@tauri-apps/api/core');
      const offlineDataStr = await invoke<string | null>('load_offline_data');

      if (!offlineDataStr) {
        return;
      }

      const offlineData = JSON.parse(offlineDataStr);

      // Sync với backend
      const { authService } = await import('./authService');
      const token = await authService.getAccessToken();

      if (token) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        
        // Sync collections, environments, etc.
        // TODO: Implement sync logic based on offline data

        // Clear offline data sau khi sync thành công
        await invoke('clear_offline_data');
      }
    } catch (error) {
      console.error('Error syncing when online:', error);
    }
  }
}

export const offlineAuthService = new OfflineAuthService();
