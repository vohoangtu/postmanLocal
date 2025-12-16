/**
 * Workspace Permission Guard
 * Kiểm tra quyền truy cập workspace và redirect nếu không có quyền
 */

import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { authService } from '../../services/authService';
import { Loader2 } from 'lucide-react';

interface WorkspacePermissionGuardProps {
  children: React.ReactNode;
}

export default function WorkspacePermissionGuard({ children }: WorkspacePermissionGuardProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { workspaces, loadWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [id, user]);

  const checkAccess = async () => {
    if (!id || !user) {
      setLoading(false);
      return;
    }

    try {
      // Load workspace nếu chưa có trong store
      await loadWorkspace(id);

      // Kiểm tra trong store
      const workspace = workspaces.find((w) => w.id.toString() === id);
      
      if (!workspace) {
        // Thử load từ API
        const token = await authService.getAccessToken();
        if (!token) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const workspaceData = await response.json();
          // Check permission
          const isOwner = workspaceData.owner_id === user.id;
          const isMember = workspaceData.team_members?.some(
            (m: any) => m.user_id === user.id
          );

          setHasAccess(isOwner || isMember || false);
          setCurrentWorkspace(workspaceData);
        } else {
          setHasAccess(false);
        }
      } else {
        // Check permission từ store
        const isOwner = workspace.owner_id === user.id;
        const isMember = workspace.team_members?.some(
          (m) => m.user_id === user.id
        );
        setHasAccess(isOwner || isMember || false);
      }
    } catch (error) {
      console.error('Failed to check workspace access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
