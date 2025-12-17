/**
 * API Client
 * Centralized API client với automatic token injection và error handling
 */

import { authService } from './authService';
import type { ApiResponse, PaginatedResponse } from '../types/workspace';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

/**
 * Custom error class cho API errors
 */
export class ApiClientError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Build URL với query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${queryString}`;
}

/**
 * Parse error response
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  let errorData: unknown;
  let errorMessage: string;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null) {
        const error = errorData as Record<string, unknown>;
        errorMessage = (error.message || error.error || response.statusText) as string;
      } else {
        errorMessage = response.statusText || 'Unknown error';
      }
    } else {
      const text = await response.text();
      errorMessage = text || response.statusText || 'Unknown error';
    }
  } catch {
    errorMessage = response.statusText || 'Unknown error';
  }

  return {
    message: errorMessage,
    status: response.status,
    data: errorData,
  };
}

/**
 * Core request function
 */
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipAuth = false, params, ...fetchConfig } = config;

  // Build URL với query parameters
  const url = buildUrl(endpoint, params);

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchConfig.headers,
  };

  // Add authorization token nếu không skip
  if (!skipAuth) {
    try {
      const token = await authService.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      // Nếu không có token, có thể là chưa đăng nhập
      // Nhưng vẫn tiếp tục request để server trả về 401
    }
  }

  // Make request
  const response = await fetch(url, {
    ...fetchConfig,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new ApiClientError(error.message, error.status, error.data);
  }

  // Parse response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    // Handle paginated response
    if (data.data && Array.isArray(data.data) && typeof data.total === 'number') {
      return data as T;
    }
    
    // Handle simple array response
    if (Array.isArray(data)) {
      return data as T;
    }
    
    // Handle ApiResponse wrapper
    if (data.data !== undefined) {
      return data.data as T;
    }
    
    return data as T;
  }

  // Return text response nếu không phải JSON
  return (await response.text()) as T;
}

/**
 * API Client với type-safe methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  },

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });
    }

    const { skipAuth = false, ...fetchConfig } = config || {};

    const url = buildUrl(endpoint);
    const headers: HeadersInit = {};

    if (!skipAuth) {
      try {
        const token = await authService.getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // Continue without token
      }
    }

    const response = await fetch(url, {
      ...fetchConfig,
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw new ApiClientError(error.message, error.status, error.data);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    }

    return (await response.text()) as T;
  },
};

export default apiClient;
