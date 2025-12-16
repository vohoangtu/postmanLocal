/**
 * Workspace Header Component
 * Hiển thị workspace info, breadcrumb, và action buttons
 */

import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore, Workspace } from '../../stores/workspaceStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useAuth } from '../../contexts/AuthContext';
import { usePresenceStore } from '../../stores/presenceStore';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import WorkspacePresence from './WorkspacePresence';
import { Users, User, Settings, Trash2, ArrowLeft, ChevronRight, Plus, UserPlus } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface WorkspaceHeaderProps {
  workspace: Workspace;
  onDelete?: () => void;
}

export default function WorkspaceHeader({ workspace, onDelete }: WorkspaceHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteWorkspace } = useWorkspaceStore();
  const permissions = useWorkspacePermission(workspace);
  const toast = useToast();

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa workspace "${workspace.name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      await deleteWorkspace(workspace.id.toString());
      toast.success('Workspace đã được xóa');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa workspace');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 shadow-md">
      <div className="px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <button
            onClick={() => navigate('/')}
            className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Home
          </button>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-gray-200 font-medium">Workspace</span>
        </div>

        {/* Header Content */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {workspace.name}
              </h1>
              {workspace.is_team ? (
                <Badge variant="primary" size="sm" className="flex items-center gap-1">
                  <Users size={12} />
                  Team
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                  <User size={12} />
                  Private
                </Badge>
              )}
            </div>
            {workspace.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {workspace.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Owner: {workspace.owner?.name || 'Unknown'}</span>
              {workspace.is_team && workspace.team_members && (
                <span>Members: {workspace.team_members.length}</span>
              )}
            </div>
            {workspace.is_team && (
              <div className="mt-2">
                <WorkspacePresence compact />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/workspace/${workspace.id}/collections`)}
                  className="flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  New Collection
                </Button>
                {workspace.is_team && permissions.canInvite && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/workspace/${workspace.id}/members`)}
                    className="flex items-center gap-1.5"
                  >
                    <UserPlus size={16} />
                    Invite Members
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/workspace/${workspace.id}/settings`)}
              className="flex items-center gap-1.5"
            >
              <Settings size={16} />
              Settings
            </Button>
            {permissions.canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-1.5"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
