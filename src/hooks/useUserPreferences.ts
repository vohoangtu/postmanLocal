/**
 * useUserPreferences Hook
 * Hook để load và apply user preferences (theme, language)
 */

import { useEffect } from 'react';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

export function useUserPreferences() {
  const { preferences, loadPreferences, applyTheme } = useUserPreferencesStore();

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    applyTheme();
    
    // Listen for system theme changes if auto theme is enabled
    if (preferences.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [preferences.theme, applyTheme]);

  return preferences;
}
