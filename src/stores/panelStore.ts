/**
 * Panel Store - Quản lý state của tất cả các panels
 * Đảm bảo chỉ một panel được mở tại một thời điểm
 */

import { create } from "zustand";

export type PanelView = 
  | "collections" 
  | "history" 
  | "templates" 
  | "environments" 
  | "schema" 
  | "mock" 
  | "docs" 
  | "workspaces" 
  | "chains" 
  | null;

interface PanelState {
  leftPanelView: PanelView;
  isLeftPanelOpen: boolean;
  activeViewTab: "response" | "tests";
  isCommandPaletteOpen: boolean;
  
  // Collaboration panel state
  activeCollaborationTab: "comments" | "annotations" | "reviews" | null;
  
  // Panel stacking order (z-index management)
  panelStack: string[];
  
  // Actions
  setLeftPanelView: (view: PanelView) => void;
  toggleLeftPanel: (view?: PanelView) => void;
  closeLeftPanel: () => void;
  setActiveViewTab: (tab: "response" | "tests") => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveCollaborationTab: (tab: "comments" | "annotations" | "reviews" | null) => void;
  closeAllPanels: () => void;
  
  // Helper để check panel nào đang active
  isPanelActive: (view: PanelView) => boolean;
}

export const usePanelStore = create<PanelState>((set, get) => ({
  leftPanelView: "collections", // Mặc định mở Collections khi app khởi động
  isLeftPanelOpen: true, // Mở panel mặc định
  activeViewTab: "response",
  isCommandPaletteOpen: false,
  activeCollaborationTab: null,
  panelStack: [],

  setLeftPanelView: (view) => {
    set({
      leftPanelView: view,
      isLeftPanelOpen: view !== null,
    });
  },

  toggleLeftPanel: (view) => {
    const currentView = get().leftPanelView;
    const targetView = view || "collections";
    
    // Nếu click vào view đang active, đóng panel
    if (currentView === targetView && get().isLeftPanelOpen) {
      set({
        leftPanelView: null,
        isLeftPanelOpen: false,
      });
    } else {
      // Mở panel với view mới
      set({
        leftPanelView: targetView,
        isLeftPanelOpen: true,
      });
    }
  },

  closeLeftPanel: () => {
    set({
      leftPanelView: null,
      isLeftPanelOpen: false,
    });
  },

  setActiveViewTab: (tab) => {
    set({ activeViewTab: tab });
  },

  setCommandPaletteOpen: (open) => {
    set({ isCommandPaletteOpen: open });
  },

  setActiveCollaborationTab: (tab) => {
    set({ activeCollaborationTab: tab });
  },

  closeAllPanels: () => {
    set({
      leftPanelView: null,
      isLeftPanelOpen: false,
      activeCollaborationTab: null,
      isCommandPaletteOpen: false,
      panelStack: [],
    });
  },

  isPanelActive: (view) => {
    return get().leftPanelView === view && get().isLeftPanelOpen;
  },
}));
