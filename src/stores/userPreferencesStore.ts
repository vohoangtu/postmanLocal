/**
 * User Preferences Store
 * Zustand store để quản lý user preferences
 */

import { create } from 'zustand';
import { authService } from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'vi' | 'en';
  notifications?: {
    email?: boolean;
    push?: boolean;
    comments?: boolean;
    shares?: boolean;
  };
  [key: string]: any;
}

interface UserPreferencesStore {
  preferences: UserPreferences;
  loading: boolean;
  loadPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  setPreferencesLocal: (preferences: Partial<UserPreferences>) => void; // Update preferences locally không cần API
  applyTheme: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesStore>((set, get) => ({
  preferences: {
    theme: 'auto',
    language: 'vi',
    notifications: {
      email: true,
      push: true,
      comments: true,
      shares: true,
    },
  },
  loading: false,

  loadPreferences: async () => {
    set({ loading: true });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({ preferences: data.preferences || {} });
        get().applyTheme();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      set({ loading: false });
    }
  },

  updatePreferences: async (newPreferences: Partial<UserPreferences>) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const currentPreferences = get().preferences;
      const updatedPreferences = { ...currentPreferences, ...newPreferences };

      const response = await fetch(`${API_BASE_URL}/user/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: updatedPreferences }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ preferences: data.preferences });
        get().applyTheme();
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  setPreferencesLocal: (newPreferences: Partial<UserPreferences>) => {
    const currentPreferences = get().preferences;
    const updatedPreferences = { ...currentPreferences, ...newPreferences };
    set({ preferences: updatedPreferences });
    get().applyTheme();
  },

  applyTheme: () => {
    const { preferences } = get();
    const theme = preferences.theme || 'auto';
    const root = document.documentElement;

    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },
}));
