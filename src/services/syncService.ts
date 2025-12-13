import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
      localStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await apiClient.post("/auth/register", data);
    if (response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },

  async getUser() {
    return await apiClient.get("/auth/user");
  },

  async logout() {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("auth_token");
  },

  async syncCollections(collections: any[]) {
    return await apiClient.post("/collections/sync", { collections });
  },

  async syncEnvironments(environments: any[]) {
    return await apiClient.post("/environments/sync", { environments });
  },

  async syncSchemas(schemas: any[]) {
    return await apiClient.post("/schemas/sync", { schemas });
  },

  async syncAll(data: { collections?: any[]; environments?: any[]; schemas?: any[] }) {
    return await apiClient.post("/sync", data);
  },
};


