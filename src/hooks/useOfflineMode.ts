/**
 * useOfflineMode Hook
 * Hook để detect offline/online status và auto-switch
 */

import { useState, useEffect } from 'react';
import { offlineAuthService } from '../services/offlineAuthService';
import { IS_TAURI } from '../utils/platform';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineAuth, setHasOfflineAuth] = useState(false);

  useEffect(() => {
    if (!IS_TAURI) {
      return;
    }

    // Check offline auth availability
    offlineAuthService.checkOfflineAuth().then(setHasOfflineAuth);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      offlineAuthService.syncWhenOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    hasOfflineAuth,
    canUseOfflineMode: IS_TAURI && hasOfflineAuth && !isOnline,
  };
}
