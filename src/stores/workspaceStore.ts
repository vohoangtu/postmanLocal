import { create } from "zustand";

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
    // This will be implemented with API call
    // For now, just update local state
    console.log("Invite member:", { workspaceId, email, role });
  },

  removeMember: async (workspaceId, userId) => {
    // This will be implemented with API call
    // For now, just update local state
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


