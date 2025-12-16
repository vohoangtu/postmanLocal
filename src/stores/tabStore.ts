import { create } from "zustand";

export interface Tab {
  id: string;
  name: string;
  method: string;
  url: string;
  requestData?: {
    headers: Array<{ key: string; value: string }>;
    body?: string;
    queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
  };
  response?: any;
  isDirty?: boolean;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  setActiveTab: (id: string | null) => void;
  addTab: (tab: Omit<Tab, "id">) => string;
  closeTab: (id: string) => void;
  closeAllTabs: () => void; // Đóng tất cả tabs nhưng giữ lại tab đang active
  updateTab: (id: string, updates: Partial<Tab>) => void;
  getTab: (id: string) => Tab | undefined;
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  setActiveTab: (id) => set({ activeTabId: id }),
  addTab: (tab) => {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTab: Tab = { ...tab, id };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
    }));
    return id;
  },
  closeTab: (id) => {
    set((state) => {
      const newTabs = state.tabs.filter((tab) => tab.id !== id);
      const newActiveId =
        state.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTabId;
      return {
        tabs: newTabs,
        activeTabId: newActiveId,
      };
    });
  },
  closeAllTabs: () => {
    set((state) => {
      // Nếu không có active tab, đóng tất cả
      if (!state.activeTabId) {
        return { tabs: [], activeTabId: null };
      }
      // Giữ lại tab đang active
      const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
      return {
        tabs: activeTab ? [activeTab] : [],
        activeTabId: state.activeTabId,
      };
    });
  },
  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab)),
    })),
  getTab: (id) => get().tabs.find((tab) => tab.id === id),
}));

