import { create } from "zustand";
import { authService } from "../services/authService";
import * as workspaceService from "../services/workspaceService";
import type { Workspace, TeamMember, WorkspaceAnalytics, WorkspaceTemplate } from "../types/workspace";

// Re-export types for backward compatibility
export type { Workspace, TeamMember } from "../types/workspace";

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspace: string | null;
  currentWorkspace: Workspace | null;
  teamMembers: TeamMember[];
  workspaceAnalytics: WorkspaceAnalytics | null;
  workspaceActivities: unknown[];
  workspaceTemplates: WorkspaceTemplate[];
  loading: boolean;
  error: string | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string | null) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  loadWorkspaces: () => Promise<void>;
  loadWorkspace: (id: string) => Promise<Workspace | null>;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  inviteMember: (workspaceId: string, email: string, role: "admin" | "member" | "viewer") => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  setTeamMembers: (members: TeamMember[]) => void;
  loadWorkspaceAnalytics: (workspaceId: string) => Promise<void>;
  loadWorkspaceActivities: (workspaceId: string) => Promise<void>;
  loadWorkspaceTemplates: (workspaceId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  currentWorkspace: null,
  teamMembers: [],
  workspaceAnalytics: null,
  workspaceActivities: [],
  workspaceTemplates: [],
  loading: false,
  error: null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  setActiveWorkspace: (id) => {
    set({ activeWorkspace: id });
    // Load team members when workspace changes
    const workspace = get().workspaces.find((w) => w.id === id);
    if (workspace?.team_members) {
      set({ teamMembers: workspace.team_members });
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  loadWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        set({ loading: false });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const workspaces = await response.json();
        set({ workspaces, loading: false });
      } else {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        set({ error: error.message || 'Failed to load workspaces', loading: false });
      }
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage, loading: false });
      console.error('Failed to load workspaces:', error);
    }
  },

  loadWorkspace: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        set({ loading: false });
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const workspace = await response.json();
        // Update store
        set((state) => {
          const existingIndex = state.workspaces.findIndex((w) => w.id === workspace.id);
          const updatedWorkspaces = existingIndex >= 0
            ? state.workspaces.map((w, i) => i === existingIndex ? workspace : w)
            : [...state.workspaces, workspace];
          
          return {
            workspaces: updatedWorkspaces,
            currentWorkspace: workspace,
            teamMembers: workspace.team_members || [],
            loading: false,
          };
        });
        return workspace;
      } else {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        set({ error: error.message || 'Failed to load workspace', loading: false });
        return null;
      }
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage, loading: false });
      console.error('Failed to load workspace:', error);
      return null;
    }
  },

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),

  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  deleteWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      activeWorkspace: state.activeWorkspace === id ? null : state.activeWorkspace,
    })),

  inviteMember: async (workspaceId, email, role) => {
    set({ error: null });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error("Chưa đăng nhập");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/invite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, role }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to invite member" }));
        const errorMessage = error.message || "Failed to invite member";
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }

      const member = await response.json();
      
      // Update local state
      set((state) => ({
        workspaces: state.workspaces.map((w) => {
          if (w.id === workspaceId) {
            return {
              ...w,
              team_members: [...(w.team_members || []), member],
            };
          }
          return w;
        }),
        teamMembers: [...state.teamMembers, member],
      }));
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage });
      throw error;
    }
  },

  removeMember: async (workspaceId, userId) => {
    set({ error: null });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error("Chưa đăng nhập");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/members/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to remove member" }));
        const errorMessage = error.message || "Failed to remove member";
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }

      // Update local state
      set((state) => ({
        teamMembers: state.teamMembers.filter((m) => m.user_id !== userId),
        workspaces: state.workspaces.map((w) => {
          if (w.id === workspaceId && w.team_members) {
            return {
              ...w,
              team_members: w.team_members.filter((m) => m.user_id !== userId),
            };
          }
          return w;
        }),
      }));
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage });
      throw error;
    }
  },

  setTeamMembers: (members) => set({ teamMembers: members }),

  loadWorkspaceAnalytics: async (workspaceId: string) => {
    set({ loading: true, error: null });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        set({ loading: false });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const analytics = await response.json();
        set({ workspaceAnalytics: analytics, loading: false });
      } else {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        set({ error: error.message || 'Failed to load workspace analytics', loading: false });
      }
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage, loading: false });
      console.error('Failed to load workspace analytics:', error);
    }
  },

  loadWorkspaceActivities: async (workspaceId: string) => {
    set({ loading: true, error: null });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        set({ loading: false });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        set({ workspaceActivities: data.data || data, loading: false });
      } else {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        set({ error: error.message || 'Failed to load workspace activities', loading: false });
      }
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage, loading: false });
      console.error('Failed to load workspace activities:', error);
    }
  },

  loadWorkspaceTemplates: async (workspaceId: string) => {
    set({ loading: true, error: null });
    try {
      const templates = await workspaceService.getWorkspaceTemplates(workspaceId);
      set({ workspaceTemplates: templates, loading: false });
    } catch (error: any) {
      const errorMessage = workspaceService.handleApiError(error).message;
      set({ error: errorMessage, loading: false });
      console.error('Failed to load workspace templates:', error);
    }
  },

  setError: (error: string | null) => set({ error }),
}));



