/**
 * Retry utility cho các operations có thể fail
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  exponentialBackoff?: boolean;
  retryCondition?: (error: any) => boolean; // Chỉ retry nếu condition trả về true
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  retryCondition: () => true, // Retry mọi lỗi mặc định
};

/**
 * Retry một async function với exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Kiểm tra xem có nên retry không
      if (!opts.retryCondition(error)) {
        throw error;
      }

      // Nếu đã hết số lần retry, throw error
      if (attempt === opts.maxRetries) {
        break;
      }

      // Tính delay cho lần retry tiếp theo
      const delay = opts.exponentialBackoff
        ? opts.retryDelay * Math.pow(2, attempt)
        : opts.retryDelay;

      // Wait trước khi retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry condition cho network errors
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || "";
  const isNetwork = 
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("connection refused") ||
    message.includes("failed to fetch") ||
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT";

  // Retry cho 5xx errors (server errors)
  const isServerError = error.status >= 500 && error.status < 600;

  return isNetwork || isServerError;
}

/**
 * Retry condition cho sync operations
 */
export function isSyncError(error: any): boolean {
  if (!error) return false;
  
  // Retry cho network errors và server errors
  if (isNetworkError(error)) return true;
  
  // Retry cho 429 (Too Many Requests)
  if (error.status === 429) return true;
  
  // Không retry cho 4xx errors (client errors) trừ 429
  if (error.status >= 400 && error.status < 500) return false;
  
  return true;
}
