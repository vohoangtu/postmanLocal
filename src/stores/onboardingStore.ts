/**
 * Onboarding Store
 * Zustand store để quản lý onboarding state
 */

import { create } from 'zustand';
import apiClient from '../services/apiClient';

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
      const data = await apiClient.get<{ onboarding: OnboardingState }>('/user/onboarding');
      set({ onboarding: data.onboarding || defaultOnboarding });
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      set({ onboarding: defaultOnboarding });
    } finally {
      set({ loading: false });
    }
  },

  completeStep: async (step: string) => {
    try {
      const data = await apiClient.post<{ onboarding: OnboardingState }>(
        '/user/onboarding/complete-step',
        { step }
      );
      set({ onboarding: data.onboarding });
    } catch (error) {
      console.error('Error completing step:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể hoàn thành bước';
      throw new Error(errorMessage);
    }
  },

  completeOnboarding: async () => {
    try {
      const data = await apiClient.post<{ onboarding: OnboardingState }>(
        '/user/onboarding/complete'
      );
      set({ onboarding: data.onboarding });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể hoàn thành onboarding';
      throw new Error(errorMessage);
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
      const data = await apiClient.post<{ onboarding: OnboardingState }>(
        '/user/onboarding/reset'
      );
      set({ onboarding: data.onboarding });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể reset onboarding';
      throw new Error(errorMessage);
    }
  },
}));
