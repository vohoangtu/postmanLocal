/**
 * Device Fingerprint Service
 * Generate device fingerprint từ browser info
 */

/**
 * Generate device fingerprint từ browser information
 */
export function generateDeviceFingerprint(): string {
  // Collect device information
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset().toString(),
    hardwareConcurrency: navigator.hardwareConcurrency?.toString() || '',
    maxTouchPoints: navigator.maxTouchPoints?.toString() || '0',
  };

  // Tạo fingerprint string
  const fingerprintString = Object.values(deviceInfo)
    .filter(Boolean)
    .join('|');

  // Hash để tạo unique identifier
  return hashString(fingerprintString);
}

/**
 * Simple hash function (SHA-256 nếu có Web Crypto API, fallback về simple hash)
 */
function hashString(str: string): string {
  // Sử dụng Web Crypto API nếu có
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Async hash - sẽ cần await, nhưng để đơn giản dùng sync version
    // Trong thực tế có thể dùng async/await
    return simpleHash(str);
  }
  
  return simpleHash(str);
}

/**
 * Simple hash function (fallback)
 * Trong production nên dùng Web Crypto API với async
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36) + str.length.toString(36);
}

/**
 * Generate device fingerprint async (sử dụng Web Crypto API)
 */
export async function generateDeviceFingerprintAsync(): Promise<string> {
  // Collect device information
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset().toString(),
    hardwareConcurrency: navigator.hardwareConcurrency?.toString() || '',
    maxTouchPoints: navigator.maxTouchPoints?.toString() || '0',
  };

  // Tạo fingerprint string
  const fingerprintString = Object.values(deviceInfo)
    .filter(Boolean)
    .join('|');

  // Hash bằng Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // Fallback
  return simpleHash(fingerprintString);
}

/**
 * Get device info object (for debugging/logging)
 */
export function getDeviceInfo(): Record<string, string> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth.toString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset().toString(),
    hardwareConcurrency: navigator.hardwareConcurrency?.toString() || '',
    maxTouchPoints: navigator.maxTouchPoints?.toString() || '0',
  };
}
