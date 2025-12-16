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
  teamMembers: TeamMember[];
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  inviteMember: (workspaceId: string, email: string, role: "admin" | "member" | "viewer") => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  setTeamMembers: (members: TeamMember[]) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  teamMembers: [],

  setWorkspaces: (workspaces) => set({ workspaces }),

  setActiveWorkspace: (id) => {
    set({ activeWorkspace: id });
    // Load team members when workspace changes
    const workspace = get().workspaces.find((w) => w.id === id);
    if (workspace?.team_members) {
      set({ teamMembers: workspace.team_members });
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
}));



