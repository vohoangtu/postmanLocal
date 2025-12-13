/**
 * Error Logging Service
 * Centralized error logging với user-friendly messages
 */

export interface ErrorLog {
  timestamp: string;
  level: "error" | "warning" | "info";
  message: string;
  error?: Error;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Interface cho error tracking service (Sentry, LogRocket, etc.)
 */
export interface ErrorTrackingService {
  captureException(error: Error, context?: Record<string, any>): void;
  captureMessage(message: string, level?: "error" | "warning" | "info", context?: Record<string, any>): void;
  setUser(user: { id: string; email?: string; username?: string }): void;
  clearUser(): void;
  setContext(key: string, value: any): void;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Giới hạn số lượng logs
  private errorTrackingService: ErrorTrackingService | null = null;

  /**
   * Set error tracking service (Sentry, LogRocket, etc.)
   */
  setErrorTrackingService(service: ErrorTrackingService) {
    this.errorTrackingService = service;
  }

  /**
   * Get error tracking service (để set user context, etc.)
   */
  getErrorTrackingService(): ErrorTrackingService | null {
    return this.errorTrackingService;
  }

  /**
   * Log error
   */
  logError(message: string, error?: Error, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      error,
      context,
      stack: error?.stack,
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console log trong development
    if (import.meta.env.DEV) {
      console.error(`[ErrorLogger] ${message}`, error, context);
    }

    // Gửi lên error tracking service nếu có
    this.sendToErrorTracking(log);
  }

  /**
   * Log warning
   */
  logWarning(message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: "warning",
      message,
      context,
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (import.meta.env.DEV) {
      console.warn(`[ErrorLogger] ${message}`, context);
    }
  }

  /**
   * Log info
   */
  logInfo(message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context,
    };

    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (import.meta.env.DEV) {
      console.info(`[ErrorLogger] ${message}`, context);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.logs
      .filter((log) => log.level === "error")
      .slice(-count)
      .reverse();
  }

  /**
   * Send to error tracking service (Sentry, etc.)
   */
  private sendToErrorTracking(log: ErrorLog) {
    if (!this.errorTrackingService) {
      return;
    }

    try {
      if (log.error) {
        this.errorTrackingService.captureException(log.error, {
          ...log.context,
          message: log.message,
          level: log.level,
        });
      } else {
        this.errorTrackingService.captureMessage(log.message, log.level, log.context);
      }
    } catch (err) {
      // Không throw error nếu error tracking service fail
      console.warn('[ErrorLogger] Failed to send to error tracking service:', err);
    }
  }
}

export const errorLogger = new ErrorLogger();

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
  TIMEOUT_ERROR: "Request đã hết thời gian chờ. Vui lòng thử lại.",
  CONNECTION_REFUSED: "Không thể kết nối đến server. Server có thể đang tắt hoặc không khả dụng.",

  // Authentication errors
  UNAUTHORIZED: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện hành động này.",
  TOKEN_EXPIRED: "Token đã hết hạn. Vui lòng đăng nhập lại.",

  // Validation errors
  INVALID_URL: "URL không hợp lệ. Vui lòng kiểm tra lại.",
  INVALID_JSON: "JSON không hợp lệ. Vui lòng kiểm tra cú pháp.",
  REQUIRED_FIELD: "Vui lòng điền đầy đủ các trường bắt buộc.",

  // Server errors
  SERVER_ERROR: "Lỗi server. Vui lòng thử lại sau.",
  NOT_FOUND: "Không tìm thấy tài nguyên yêu cầu.",
  BAD_REQUEST: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.",

  // Generic errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định. Vui lòng thử lại.",
  OPERATION_FAILED: "Thao tác thất bại. Vui lòng thử lại.",

  // Sync errors
  SYNC_FAILED: "Đồng bộ thất bại. Vui lòng kiểm tra kết nối và thử lại.",
  SYNC_CONFLICT: "Có xung đột khi đồng bộ. Vui lòng giải quyết xung đột trước khi tiếp tục.",

  // File errors
  FILE_NOT_FOUND: "Không tìm thấy file.",
  FILE_READ_ERROR: "Không thể đọc file. Vui lòng kiểm tra quyền truy cập.",
  FILE_WRITE_ERROR: "Không thể ghi file. Vui lòng kiểm tra quyền truy cập.",
};

/**
 * Get user-friendly error message từ error object
 */
export function getUserFriendlyError(error: any): string {
  if (!error) {
    return ErrorMessages.UNKNOWN_ERROR;
  }

  // Nếu đã là user-friendly message
  if (typeof error === "string") {
    return error;
  }

  // Network errors
  if (error.message) {
    const msg = error.message.toLowerCase();

    if (msg.includes("network") || msg.includes("fetch")) {
      return ErrorMessages.NETWORK_ERROR;
    }

    if (msg.includes("timeout")) {
      return ErrorMessages.TIMEOUT_ERROR;
    }

    if (msg.includes("connection refused") || msg.includes("failed to fetch")) {
      return ErrorMessages.CONNECTION_REFUSED;
    }

    if (msg.includes("unauthorized") || msg.includes("401")) {
      return ErrorMessages.UNAUTHORIZED;
    }

    if (msg.includes("forbidden") || msg.includes("403")) {
      return ErrorMessages.FORBIDDEN;
    }

    if (msg.includes("not found") || msg.includes("404")) {
      return ErrorMessages.NOT_FOUND;
    }

    if (msg.includes("bad request") || msg.includes("400")) {
      return ErrorMessages.BAD_REQUEST;
    }

    if (msg.includes("server error") || msg.includes("500")) {
      return ErrorMessages.SERVER_ERROR;
    }

    if (msg.includes("token") && msg.includes("expired")) {
      return ErrorMessages.TOKEN_EXPIRED;
    }

    if (msg.includes("json")) {
      return ErrorMessages.INVALID_JSON;
    }

    if (msg.includes("url")) {
      return ErrorMessages.INVALID_URL;
    }
  }

  // HTTP status code
  if (error.status) {
    switch (error.status) {
      case 400:
        return ErrorMessages.BAD_REQUEST;
      case 401:
        return ErrorMessages.UNAUTHORIZED;
      case 403:
        return ErrorMessages.FORBIDDEN;
      case 404:
        return ErrorMessages.NOT_FOUND;
      case 500:
      case 502:
      case 503:
        return ErrorMessages.SERVER_ERROR;
      default:
        return error.message || ErrorMessages.UNKNOWN_ERROR;
    }
  }

  // Response data từ API
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Default: return error message hoặc unknown error
  return error.message || ErrorMessages.UNKNOWN_ERROR;
}

/**
 * Handle error với logging và user-friendly message
 */
export function handleError(
  error: any,
  context?: string,
  additionalContext?: Record<string, any>
): string {
  const userMessage = getUserFriendlyError(error);
  const errorObj = error instanceof Error ? error : new Error(String(error));

  errorLogger.logError(
    context ? `${context}: ${userMessage}` : userMessage,
    errorObj,
    additionalContext
  );

  return userMessage;
}
