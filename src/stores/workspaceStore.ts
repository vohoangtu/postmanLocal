import { create } from "zustand";
import { authService } from "../services/authService";

export interface TeamMember {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_team: boolean;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  team_members?: TeamMember[];
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspace: string | null;
  currentWorkspace: Workspace | null;
  teamMembers: TeamMember[];
  workspaceAnalytics: any | null;
  workspaceActivities: any[];
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
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  currentWorkspace: null,
  teamMembers: [],
  workspaceAnalytics: null,
  workspaceActivities: [],

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
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

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
        set({ workspaces });
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  },

  loadWorkspace: async (id: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return null;

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
          };
        });
        return workspace;
      }
      return null;
    } catch (error) {
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
      throw new Error(error.message || "Failed to invite member");
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
  },

  removeMember: async (workspaceId, userId) => {
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
      throw new Error(error.message || "Failed to remove member");
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
  },

  setTeamMembers: (members) => set({ teamMembers: members }),

  loadWorkspaceAnalytics: async (workspaceId: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

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
        set({ workspaceAnalytics: analytics });
      }
    } catch (error) {
      console.error('Failed to load workspace analytics:', error);
    }
  },

  loadWorkspaceActivities: async (workspaceId: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

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
        set({ workspaceActivities: data.data || data });
      }
    } catch (error) {
      console.error('Failed to load workspace activities:', error);
    }
  },
}));



