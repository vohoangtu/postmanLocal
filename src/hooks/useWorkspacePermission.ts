/**
 * Hook để check permissions trong workspace
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceStore, Workspace } from '../stores/workspaceStore';

export interface WorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canManageMembers: boolean;
  canDelete: boolean;
  canInvite: boolean;
  role: 'owner' | 'admin' | 'member' | 'viewer' | null;
  isOwner: boolean;
  isAdmin: boolean;
}

export function useWorkspacePermission(workspace: Workspace | null): WorkspacePermissions {
  const { user } = useAuth();
  const { workspaces } = useWorkspaceStore();

  return useMemo(() => {
    if (!workspace || !user) {
      return {
        canView: false,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        canInvite: false,
        role: null,
        isOwner: false,
        isAdmin: false,
      };
    }

    // Owner có tất cả quyền
    if (workspace.owner_id === user.id) {
      return {
        canView: true,
        canEdit: true,
        canManageMembers: true,
        canDelete: true,
        canInvite: true,
        role: 'owner',
        isOwner: true,
        isAdmin: true,
      };
    }

    // Tìm team member role
    const member = workspace.team_members?.find((m) => m.user_id === user.id);
    if (!member) {
      return {
        canView: false,
        canEdit: false,
        canManageMembers: false,
        canDelete: false,
        canInvite: false,
        role: null,
        isOwner: false,
        isAdmin: false,
      };
    }

    const role = member.role;
    const isAdmin = role === 'admin' || role === 'owner';
    const isMember = role === 'member' || isAdmin;

    return {
      canView: true,
      canEdit: isMember,
      canManageMembers: isAdmin,
      canDelete: false, // Chỉ owner có thể delete
      canInvite: isAdmin,
      role,
      isOwner: false,
      isAdmin,
    };
  }, [workspace, user, workspaces]);
}
