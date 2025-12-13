/**
 * Encryption Service
 * Mã hóa và giải mã dữ liệu nhạy cảm
 */

import { IS_TAURI } from '../utils/platform';

/**
 * Interface cho encryption key
 */
interface EncryptionKey {
  key: CryptoKey;
  iv: Uint8Array;
}

/**
 * Encryption Service
 */
class EncryptionService {
  private keyCache: Map<string, EncryptionKey> = new Map();

  /**
   * Tạo encryption key từ password hoặc device key
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Lấy hoặc tạo encryption key
   */
  private async getOrCreateKey(keyId: string): Promise<EncryptionKey> {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    // Tạo salt từ keyId
    const encoder = new TextEncoder();
    const saltData = encoder.encode(keyId + 'postmanlocal_salt');
    const salt = await crypto.subtle.digest('SHA-256', saltData);
    const saltArray = new Uint8Array(salt).slice(0, 16);

    // Sử dụng device key hoặc user password
    let password: string;
    if (IS_TAURI) {
      // Trong Tauri, có thể sử dụng device ID hoặc secure storage
      password = await this.getDeviceKey();
    } else {
      // Trong Web, sử dụng một key được lưu trong localStorage
      password = await this.getWebKey();
    }

    const key = await this.deriveKey(password, saltArray);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptionKey: EncryptionKey = { key, iv };
    this.keyCache.set(keyId, encryptionKey);

    return encryptionKey;
  }

  /**
   * Lấy device key (Tauri)
   */
  private async getDeviceKey(): Promise<string> {
    if (!IS_TAURI) {
      throw new Error('Device key chỉ có trong Tauri environment');
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const deviceId = await invoke<string>('get_device_id');
      return deviceId || 'default_device_key';
    } catch {
      return 'default_device_key';
    }
  }

  /**
   * Lấy web key (Web environment)
   */
  private async getWebKey(): Promise<string> {
    const stored = localStorage.getItem('postmanlocal_encryption_key');
    if (stored) {
      return stored;
    }

    // Tạo key mới
    const key = crypto.getRandomValues(new Uint8Array(32));
    const keyString = Array.from(key)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem('postmanlocal_encryption_key', keyString);
    return keyString;
  }

  /**
   * Mã hóa dữ liệu
   */
  async encrypt(data: string, keyId: string = 'default'): Promise<string> {
    try {
      const { key, iv } = await this.getOrCreateKey(keyId);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Kết hợp IV và encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Encode thành base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Không thể mã hóa dữ liệu');
    }
  }

  /**
   * Giải mã dữ liệu
   */
  async decrypt(encryptedData: string, keyId: string = 'default'): Promise<string> {
    try {
      const { key } = await this.getOrCreateKey(keyId);

      // Decode từ base64
      const combined = Uint8Array.from(
        atob(encryptedData),
        (c) => c.charCodeAt(0)
      );

      // Tách IV và encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Không thể giải mã dữ liệu');
    }
  }

  /**
   * Xóa key cache
   */
  clearCache(): void {
    this.keyCache.clear();
  }
}

export const encryptionService = new EncryptionService();
