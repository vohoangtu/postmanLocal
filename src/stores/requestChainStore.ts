import { create } from "zustand";
import { ChainStep } from "../services/requestChainService";

interface RequestChainStore {
  chains: RequestChain[];
  activeChain: string | null;
  setChains: (chains: RequestChain[]) => void;
  setActiveChain: (id: string | null) => void;
  addChain: (chain: RequestChain) => void;
  updateChain: (id: string, updates: Partial<RequestChain>) => void;
  deleteChain: (id: string) => void;
  addStep: (chainId: string, step: ChainStep) => void;
  updateStep: (chainId: string, stepId: string, updates: Partial<ChainStep>) => void;
  deleteStep: (chainId: string, stepId: string) => void;
  reorderSteps: (chainId: string, stepIds: string[]) => void;
}

export interface RequestChain {
  id: string;
  name: string;
  description?: string;
  steps: ChainStep[];
  variables: Record<string, any>;
}

export const useRequestChainStore = create<RequestChainStore>((set) => ({
  chains: [],
  activeChain: null,

  setChains: (chains) => set({ chains }),

  setActiveChain: (id) => set({ activeChain: id }),

  addChain: (chain) =>
    set((state) => ({
      chains: [...state.chains, chain],
    })),

  updateChain: (id, updates) =>
    set((state) => ({
      chains: state.chains.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  deleteChain: (id) =>
    set((state) => ({
      chains: state.chains.filter((c) => c.id !== id),
      activeChain: state.activeChain === id ? null : state.activeChain,
    })),

  addStep: (chainId, step) =>
    set((state) => ({
      chains: state.chains.map((c) =>
        c.id === chainId ? { ...c, steps: [...c.steps, step] } : c
      ),
    })),

  updateStep: (chainId, stepId, updates) =>
    set((state) => ({
      chains: state.chains.map((c) =>
        c.id === chainId
          ? {
              ...c,
              steps: c.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
            }
          : c
      ),
    })),

  deleteStep: (chainId, stepId) =>
    set((state) => ({
      chains: state.chains.map((c) =>
        c.id === chainId ? { ...c, steps: c.steps.filter((s) => s.id !== stepId) } : c
      ),
    })),

  reorderSteps: (chainId, stepIds) =>
    set((state) => {
      const chain = state.chains.find((c) => c.id === chainId);
      if (!chain) return state;

      const reorderedSteps = stepIds
        .map((id) => chain.steps.find((s) => s.id === id))
        .filter((s): s is ChainStep => s !== undefined);

      return {
        chains: state.chains.map((c) =>
          c.id === chainId ? { ...c, steps: reorderedSteps } : c
        ),
      };
    }),
}));


