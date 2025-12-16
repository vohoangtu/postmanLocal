/**
 * API Test Store
 * Quản lý state cho API test suites
 */

import { create } from 'zustand';

export interface TestResult {
  path: string;
  method: string;
  passed: boolean;
  errors: string[];
  response_status?: number;
  response_body?: string;
}

export interface TestSummary {
  passed: number;
  failed: number;
  total: number;
}

export interface TestSuiteResults {
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  results?: TestResult[];
  summary?: TestSummary;
  error?: string;
}

export interface ApiTestSuite {
  id: string;
  workspace_id: string;
  schema_id?: string;
  name: string;
  description?: string;
  test_config: {
    base_url?: string;
    [key: string]: any;
  };
  results?: TestSuiteResults;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  created_by_id: string;
  last_run_at?: string;
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

interface ApiTestStore {
  testSuites: ApiTestSuite[];
  selectedSuite: string | null;
  isLoading: boolean;

  setTestSuites: (suites: ApiTestSuite[]) => void;
  setSelectedSuite: (id: string | null) => void;
  addTestSuite: (suite: ApiTestSuite) => void;
  updateTestSuite: (id: string, updates: Partial<ApiTestSuite>) => void;
  deleteTestSuite: (id: string) => void;
  setLoading: (loading: boolean) => void;
  getTestSuite: (id: string) => ApiTestSuite | undefined;
}

export const useApiTestStore = create<ApiTestStore>((set, get) => ({
  testSuites: [],
  selectedSuite: null,
  isLoading: false,

  setTestSuites: (suites) => set({ testSuites: suites }),
  setSelectedSuite: (id) => set({ selectedSuite: id }),
  addTestSuite: (suite) =>
    set((state) => ({ testSuites: [...state.testSuites, suite] })),
  updateTestSuite: (id, updates) =>
    set((state) => ({
      testSuites: state.testSuites.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  deleteTestSuite: (id) =>
    set((state) => ({
      testSuites: state.testSuites.filter((s) => s.id !== id),
      selectedSuite: state.selectedSuite === id ? null : state.selectedSuite,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  getTestSuite: (id) => get().testSuites.find((s) => s.id === id),
}));
