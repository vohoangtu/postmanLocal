/**
 * Mock Server Store
 * Quản lý state cho mock servers
 */

import { create } from 'zustand';

export interface MockRoute {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  response: {
    status: number;
    headers: { [key: string]: string };
    body: any;
  };
}

export interface MockServer {
  id: string;
  workspace_id: string;
  schema_id?: string;
  name: string;
  base_url: string;
  port: number;
  is_active: boolean;
  config?: any;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  schema?: {
    id: string;
    name: string;
  };
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
}

interface MockServerStore {
  mockServers: MockServer[];
  selectedServer: string | null;
  routes: { [serverId: string]: MockRoute[] };
  isLoading: boolean;

  setMockServers: (servers: MockServer[]) => void;
  setSelectedServer: (id: string | null) => void;
  addMockServer: (server: MockServer) => void;
  updateMockServer: (id: string, updates: Partial<MockServer>) => void;
  deleteMockServer: (id: string) => void;
  setRoutes: (serverId: string, routes: MockRoute[]) => void;
  setLoading: (loading: boolean) => void;
  getMockServer: (id: string) => MockServer | undefined;
}

export const useMockServerStore = create<MockServerStore>((set, get) => ({
  mockServers: [],
  selectedServer: null,
  routes: {},
  isLoading: false,

  setMockServers: (servers) => set({ mockServers: servers }),
  setSelectedServer: (id) => set({ selectedServer: id }),
  addMockServer: (server) =>
    set((state) => ({ mockServers: [...state.mockServers, server] })),
  updateMockServer: (id, updates) =>
    set((state) => ({
      mockServers: state.mockServers.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  deleteMockServer: (id) =>
    set((state) => ({
      mockServers: state.mockServers.filter((s) => s.id !== id),
      selectedServer: state.selectedServer === id ? null : state.selectedServer,
    })),
  setRoutes: (serverId, routes) =>
    set((state) => ({
      routes: { ...state.routes, [serverId]: routes },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  getMockServer: (id) => get().mockServers.find((s) => s.id === id),
}));
