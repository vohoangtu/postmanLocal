/**
 * Task Store
 * Quản lý tasks trong collection
 */

import { create } from 'zustand';
import { authService } from '../services/authService';
import type { Task } from '../types/workspace';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  loadTasks: (collectionId: string, filters?: any) => Promise<void>;
  createTask: (collectionId: string, taskData: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTask: (taskId: string, userId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,

  loadTasks: async (collectionId, filters = {}) => {
    set({ loading: true });
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const tasks = Array.isArray(data) ? data : (data.data || []);
        set({ tasks });
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (collectionId, taskData) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/tasks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...taskData, collection_id: collectionId }),
        }
      );

      if (response.ok) {
        const task = await response.json();
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create task');
      }
    } catch (error: any) {
      throw error;
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/tasks/${taskId}`,
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
          tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
      }
    } catch (error: any) {
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete task');
      }
    } catch (error: any) {
      throw error;
    }
  },

  assignTask: async (taskId, userId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/tasks/${taskId}/assign`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assigned_to: userId }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign task');
      }
    } catch (error: any) {
      throw error;
    }
  },

  completeTask: async (taskId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/tasks/${taskId}/complete`,
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
          tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete task');
      }
    } catch (error: any) {
      throw error;
    }
  },

  clearTasks: () => set({ tasks: [] }),
}));
