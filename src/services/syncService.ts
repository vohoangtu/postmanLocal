import axios, { AxiosError } from "axios";
import { retry, isSyncError } from "../utils/retry";
import { handleError } from "./errorLogger";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

import { authService } from './authService';

// Add token to requests if available
apiClient.interceptors.request.use(async (config) => {
  // Check if token is expired and refresh if needed
  if (await authService.isTokenExpired()) {
    try {
      const tokens = await authService.refreshAccessToken();
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    } catch (error) {
      // Refresh failed, will be handled by response interceptor
    }
  } else {
    const token = await authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor để handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const tokens = await authService.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await authService.clearTokens();
        // Dispatch event để UI có thể handle
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const syncService = {
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post("/auth/login", credentials);
    if (response.data.token) {
      await authService.saveTokens({
        accessToken: response.data.token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at ? new Date(response.data.expires_at).getTime() : undefined,
      });
      if (response.data.user) {
        await authService.saveUser(response.data.user);
      }
    }
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await apiClient.post("/auth/register", data);
    if (response.data.token) {
      await authService.saveTokens({
        accessToken: response.data.token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at ? new Date(response.data.expires_at).getTime() : undefined,
      });
      if (response.data.user) {
        await authService.saveUser(response.data.user);
      }
    }
    return response.data;
  },

  async getUser() {
    return await apiClient.get("/auth/user");
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Continue even if logout fails
    }
    await authService.clearTokens();
  },

  async syncCollections(collections: any[]) {
    try {
      return await retry(
        () => apiClient.post("/collections/sync", { collections }),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          retryCondition: isSyncError,
        }
      );
    } catch (error: any) {
      handleError(error, "Sync Collections");
      throw error;
    }
  },

  async syncEnvironments(environments: any[]) {
    try {
      return await retry(
        () => apiClient.post("/environments/sync", { environments }),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          retryCondition: isSyncError,
        }
      );
    } catch (error: any) {
      handleError(error, "Sync Environments");
      throw error;
    }
  },

  async syncSchemas(schemas: any[]) {
    try {
      return await retry(
        () => apiClient.post("/schemas/sync", { schemas }),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          retryCondition: isSyncError,
        }
      );
    } catch (error: any) {
      handleError(error, "Sync Schemas");
      throw error;
    }
  },

  async syncAll(data: { collections?: any[]; environments?: any[]; schemas?: any[] }) {
    try {
      return await retry(
        () => apiClient.post("/sync", data),
        {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
          retryCondition: isSyncError,
        }
      );
    } catch (error: any) {
      handleError(error, "Sync All");
      throw error;
    }
  },
};


