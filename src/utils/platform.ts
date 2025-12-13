/**
 * Platform detection utilities
 * Hỗ trợ phát hiện môi trường chạy (Tauri Desktop hoặc Web)
 */

// Kiểm tra xem có đang chạy trong Tauri không
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// Kiểm tra xem có đang chạy trên Web không
export function isWeb(): boolean {
  return !isTauri();
}

// Platform constants
export const PLATFORM = isTauri() ? 'tauri' : 'web';
export const IS_TAURI = isTauri();
export const IS_WEB = isWeb();

// Type guard để TypeScript hiểu rõ hơn
export function assertTauri(): asserts globalThis is typeof globalThis & { __TAURI_INTERNALS__: any } {
  if (!isTauri()) {
    throw new Error('This function requires Tauri environment');
  }
}

