/**
 * Discussion Store
 * Quản lý discussions trong workspace
 */

import { create } from 'zustand';
import { authService } from '../services/authService';

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Discussion {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  created_by: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  resolver?: {
    id: string;
    name: string;
    email: string;
  };
  replies?: DiscussionReply[];
}

interface DiscussionStore {
  discussions: Discussion[];
  loading: boolean;
  loadDiscussions: (workspaceId: string, filters?: any) => Promise<void>;
  createDiscussion: (workspaceId: string, discussionData: Partial<Discussion>) => Promise<Discussion>;
  updateDiscussion: (discussionId: string, updates: Partial<Discussion>) => Promise<void>;
  deleteDiscussion: (discussionId: string) => Promise<void>;
  addReply: (discussionId: string, content: string) => Promise<DiscussionReply>;
  resolveDiscussion: (discussionId: string) => Promise<void>;
  unresolveDiscussion: (discussionId: string) => Promise<void>;
  clearDiscussions: () => void;
}

export const useDiscussionStore = create<DiscussionStore>((set, get) => ({
  discussions: [],
  loading: false,

  loadDiscussions: async (workspaceId, filters = {}) => {
    set({ loading: true });
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/discussions${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const discussions = Array.isArray(data) ? data : (data.data || []);
        set({ discussions });
      }
    } catch (error) {
      console.error('Failed to load discussions:', error);
    } finally {
      set({ loading: false });
    }
  },

  createDiscussion: async (workspaceId, discussionData) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/discussions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(discussionData),
        }
      );

      if (response.ok) {
        const discussion = await response.json();
        set((state) => ({ discussions: [discussion, ...state.discussions] }));
        return discussion;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create discussion');
      }
    } catch (error: any) {
      throw error;
    }
  },

  updateDiscussion: async (discussionId, updates) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/discussions/${discussionId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          discussions: state.discussions.map((d) => (d.id === discussionId ? updated : d)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update discussion');
      }
    } catch (error: any) {
      throw error;
    }
  },

  deleteDiscussion: async (discussionId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/discussions/${discussionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        set((state) => ({
          discussions: state.discussions.filter((d) => d.id !== discussionId),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete discussion');
      }
    } catch (error: any) {
      throw error;
    }
  },

  addReply: async (discussionId, content) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/discussions/${discussionId}/replies`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        const reply = await response.json();
        // Reload discussion to get updated replies
        const discussion = get().discussions.find((d) => d.id === discussionId);
        if (discussion) {
          // Update discussion with new reply
          set((state) => ({
            discussions: state.discussions.map((d) =>
              d.id === discussionId
                ? { ...d, replies: [...(d.replies || []), reply] }
                : d
            ),
          }));
        }
        return reply;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add reply');
      }
    } catch (error: any) {
      throw error;
    }
  },

  resolveDiscussion: async (discussionId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/discussions/${discussionId}/resolve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          discussions: state.discussions.map((d) => (d.id === discussionId ? updated : d)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resolve discussion');
      }
    } catch (error: any) {
      throw error;
    }
  },

  unresolveDiscussion: async (discussionId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/discussions/${discussionId}/unresolve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          discussions: state.discussions.map((d) => (d.id === discussionId ? updated : d)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unresolve discussion');
      }
    } catch (error: any) {
      throw error;
    }
  },

  clearDiscussions: () => set({ discussions: [] }),
}));
