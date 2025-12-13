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
  activeEnvironment: string | null;
  setEnvironments: (environments: Environment[]) => void;
  setActiveEnvironment: (id: string | null) => void;
  addEnvironment: (environment: Environment) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  getVariable: (key: string) => string | null;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environments: [],
  activeEnvironment: null,
  setEnvironments: (environments) => set({ environments }),
  setActiveEnvironment: (id) => set({ activeEnvironment: id }),
  addEnvironment: (environment) =>
    set((state) => ({ environments: [...state.environments, environment] })),
  updateEnvironment: (id, updates) =>
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  deleteEnvironment: (id) =>
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvironment: state.activeEnvironment === id ? null : state.activeEnvironment,
    })),
  getVariable: (key) => {
    const state = get();
    const activeEnv = state.environments.find((e) => e.id === state.activeEnvironment);
    if (!activeEnv) return null;
    const variable = activeEnv.variables.find((v) => v.key === key && v.enabled);
    return variable ? variable.value : null;
  },
}));


