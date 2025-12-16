import { create } from "zustand";

interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

interface EnvironmentStore {
  environments: Environment[];
  workspaceEnvironments: Environment[]; // Environments của workspace hiện tại
  activeEnvironment: string | null;
  workspaceId: string | null; // Workspace ID hiện tại
  setEnvironments: (environments: Environment[]) => void;
  setWorkspaceEnvironments: (environments: Environment[]) => void;
  setWorkspaceEnvironment: (workspaceId: string | null) => void;
  setActiveEnvironment: (id: string | null) => void;
  addEnvironment: (environment: Environment) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  loadWorkspaceEnvironments: (workspaceId: string) => Promise<void>;
  getVariable: (key: string) => string | null;
  replaceVariables: (text: string) => string;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environments: [],
  workspaceEnvironments: [],
  activeEnvironment: null,
  workspaceId: null,
  setEnvironments: (environments) => set({ environments }),
  setWorkspaceEnvironments: (environments) => set({ workspaceEnvironments: environments }),
  setWorkspaceEnvironment: (workspaceId) => {
    set({ workspaceId });
    if (!workspaceId) {
      // Reset về user environments
      set({ workspaceEnvironments: [] });
    }
  },
  setActiveEnvironment: (id) => set({ activeEnvironment: id }),
  addEnvironment: (environment) =>
    set((state) => ({ environments: [...state.environments, environment] })),
  updateEnvironment: (id, updates) =>
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      workspaceEnvironments: state.workspaceEnvironments.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  deleteEnvironment: (id) =>
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      workspaceEnvironments: state.workspaceEnvironments.filter((e) => e.id !== id),
      activeEnvironment: state.activeEnvironment === id ? null : state.activeEnvironment,
    })),
  loadWorkspaceEnvironments: async (workspaceId: string) => {
    try {
      const { environmentService } = await import('../services/environmentService');
      const environments = await environmentService.getWorkspaceEnvironments(workspaceId);
      set({ workspaceEnvironments: environments, workspaceId });
    } catch (error) {
      console.error('Failed to load workspace environments:', error);
      set({ workspaceEnvironments: [], workspaceId });
    }
  },
  getVariable: (key) => {
    const state = get();
    // Ưu tiên workspace environment nếu có
    const envsToSearch = state.workspaceId && state.workspaceEnvironments.length > 0
      ? state.workspaceEnvironments
      : state.environments;
    
    const activeEnv = envsToSearch.find((e) => e.id === state.activeEnvironment);
    if (!activeEnv) return null;
    const variable = activeEnv.variables.find((v) => v.key === key && v.enabled);
    return variable ? variable.value : null;
  },
  replaceVariables: (text) => {
    const state = get();
    // Ưu tiên workspace environment nếu có
    const envsToSearch = state.workspaceId && state.workspaceEnvironments.length > 0
      ? state.workspaceEnvironments
      : state.environments;
    
    const activeEnv = envsToSearch.find((e) => e.id === state.activeEnvironment);
    if (!activeEnv || !text) return text;
    
    let result = text;
    activeEnv.variables.forEach((variable) => {
      if (variable.enabled) {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, "g");
        result = result.replace(regex, variable.value);
      }
    });
    return result;
  },
}));


