/**
 * useWorkspaceData Hook
 * Reusable hook để load workspace data và handle loading/error states
 */

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import type { Workspace } from '../types/workspace';

export interface UseWorkspaceDataResult {
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook để load và quản lý workspace data
 */
export function useWorkspaceData(workspaceId: string | undefined): UseWorkspaceDataResult {
  const { currentWorkspace, loadWorkspace, loading, error } = useWorkspaceStore();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace(workspaceId).catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải workspace';
        setLocalError(errorMessage);
      });
    }
  }, [workspaceId, loadWorkspace]);

  const reload = async () => {
    if (!workspaceId) return;
    setLocalError(null);
    try {
      await loadWorkspace(workspaceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải workspace';
      setLocalError(errorMessage);
    }
  };

  return {
    workspace: currentWorkspace,
    loading,
    error: error || localError,
    reload,
  };
}

export default useWorkspaceData;
