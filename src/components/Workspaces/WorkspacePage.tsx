/**
 * Workspace Page Component
 * Main component cho workspace page với routing
 */

import { useParams, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import WorkspaceLayout from './WorkspaceLayout';
import { Loader2 } from 'lucide-react';

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
    }
  }, [id, loadWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <WorkspaceLayout>
      <Outlet />
    </WorkspaceLayout>
  );
}
