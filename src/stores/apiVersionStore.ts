/**
 * API Version Store
 * Quản lý state cho API versions
 */

import { create } from 'zustand';

export interface ApiVersion {
  id: string;
  schema_id: string;
  version_number: number;
  version_name?: string;
  changelog?: string;
  schema_data: any;
  is_current: boolean;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface VersionDiff {
  type: 'added' | 'removed' | 'modified';
  path: string;
  value?: any;
  old_value?: any;
  new_value?: any;
}

interface ApiVersionStore {
  versions: ApiVersion[];
  selectedVersion: string | null;
  diff: {
    current: any;
    previous: any;
    diff: VersionDiff[];
  } | null;
  isLoading: boolean;

  setVersions: (versions: ApiVersion[]) => void;
  setSelectedVersion: (id: string | null) => void;
  addVersion: (version: ApiVersion) => void;
  updateVersion: (id: string, updates: Partial<ApiVersion>) => void;
  setDiff: (diff: any) => void;
  setLoading: (loading: boolean) => void;
  getVersion: (id: string) => ApiVersion | undefined;
}

export const useApiVersionStore = create<ApiVersionStore>((set, get) => ({
  versions: [],
  selectedVersion: null,
  diff: null,
  isLoading: false,

  setVersions: (versions) => set({ versions }),
  setSelectedVersion: (id) => set({ selectedVersion: id }),
  addVersion: (version) =>
    set((state) => ({ versions: [version, ...state.versions] })),
  updateVersion: (id, updates) =>
    set((state) => ({
      versions: state.versions.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),
  setDiff: (diff) => set({ diff }),
  setLoading: (loading) => set({ isLoading: loading }),
  getVersion: (id) => get().versions.find((v) => v.id === id),
}));
