import { create } from "zustand";

interface Request {
  id?: string;
  name: string;
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body?: string;
}

interface RequestStore {
  currentRequest: Request | null;
  setCurrentRequest: (request: Request | null) => void;
  updateRequest: (updates: Partial<Request>) => void;
}

export const useRequestStore = create<RequestStore>((set) => ({
  currentRequest: null,
  setCurrentRequest: (request) => set({ currentRequest: request }),
  updateRequest: (updates) =>
    set((state) => ({
      currentRequest: state.currentRequest
        ? { ...state.currentRequest, ...updates }
        : null,
    })),
}));


