import { create } from "zustand";

export interface RequestHistoryItem {
  id: string;
  method: string;
  url: string;
  timestamp: number;
  status?: number;
  statusText?: string;
  duration?: number;
}

interface RequestHistoryStore {
  history: RequestHistoryItem[];
  addToHistory: (item: Omit<RequestHistoryItem, "id" | "timestamp">) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  getRecent: (limit?: number) => RequestHistoryItem[];
}

export const useRequestHistoryStore = create<RequestHistoryStore>((set, get) => ({
  history: [],
  addToHistory: (item) => {
    const newItem: RequestHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    set((state) => ({
      history: [newItem, ...state.history].slice(0, 100), // Keep last 100
    }));
  },
  clearHistory: () => set({ history: [] }),
  removeFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),
  getRecent: (limit = 10) => {
    const history = get().history;
    return history.slice(0, limit);
  },
}));

