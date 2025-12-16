/**
 * Onboarding Store
 * Zustand store để quản lý onboarding state
 */

import { create } from 'zustand';
import { authService } from '../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface OnboardingState {
  completed: boolean;
  current_step: string;
  completed_steps: string[];
  started_at: string | null;
  completed_at: string | null;
}

interface OnboardingStore {
  onboarding: OnboardingState | null;
  loading: boolean;
  loadOnboardingStatus: () => Promise<void>;
  completeStep: (step: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  hasCompletedOnboarding: () => boolean;
  getCurrentStep: () => string;
  resetOnboarding: () => Promise<void>;
}

const defaultOnboarding: OnboardingState = {
  completed: false,
  current_step: 'welcome',
  completed_steps: [],
  started_at: null,
  completed_at: null,
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  onboarding: null,
  loading: false,

  loadOnboardingStatus: async () => {
    set({ loading: true });
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        set({ onboarding: defaultOnboarding, loading: false });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/onboarding`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({ onboarding: data.onboarding || defaultOnboarding });
      } else {
        set({ onboarding: defaultOnboarding });
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      set({ onboarding: defaultOnboarding });
    } finally {
      set({ loading: false });
    }
  },

  completeStep: async (step: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(`${API_BASE_URL}/user/onboarding/complete-step`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ onboarding: data.onboarding });
      } else {
        throw new Error('Không thể hoàn thành bước');
      }
    } catch (error) {
      console.error('Error completing step:', error);
      throw error;
    }
  },

  completeOnboarding: async () => {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(`${API_BASE_URL}/user/onboarding/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({ onboarding: data.onboarding });
      } else {
        throw new Error('Không thể hoàn thành onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  },

  hasCompletedOnboarding: () => {
    const { onboarding } = get();
    return onboarding?.completed === true;
  },

  getCurrentStep: () => {
    const { onboarding } = get();
    return onboarding?.current_step || 'welcome';
  },

  resetOnboarding: async () => {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('Chưa đăng nhập');
      }

      const response = await fetch(`${API_BASE_URL}/user/onboarding/reset`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({ onboarding: data.onboarding });
      } else {
        throw new Error('Không thể reset onboarding');
      }
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  },
}));
