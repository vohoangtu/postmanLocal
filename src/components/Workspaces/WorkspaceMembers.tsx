/**
 * Workspace Members Component
 * Quản lý team members cho team workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import InviteMemberModal from './InviteMemberModal';
import { Users, Plus, Loader2 } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';

export default function WorkspaceMembers() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
    }
  }, [id, loadWorkspace]);

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  const members = currentWorkspace.team_members || [];
  const owner = currentWorkspace.owner;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Team Members
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {members.length + 1} member{members.length !== 0 ? 's' : ''} (including owner)
          </p>
        </div>
        {permissions.canInvite && (
          <Button
            variant="primary"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Invite Member
          </Button>
        )}
      </div>

      {/* Owner Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Owner
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                {owner?.name?.charAt(0).toUpperCase() || 'O'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {owner?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {owner?.email}
                </p>
              </div>
            </div>
            <Badge variant="primary" className={getRoleBadgeColor('owner')}>
              Owner
            </Badge>
          </div>
        </div>
      </div>

      {/* Members Section */}
      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Invite team members to collaborate on this workspace"
          action={
            permissions.canInvite
              ? {
                  label: 'Invite Member',
                  onClick: () => setShowInviteModal(true),
                }
              : undefined
          }
        />
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Members
          </h3>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {member.user?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                    {permissions.canManageMembers && member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Remove ${member.user?.name} from workspace?`)) return;
                          try {
                            const { removeMember } = useWorkspaceStore.getState();
                            await removeMember(
                              currentWorkspace.id.toString(),
                              member.user_id
                            );
                            await loadWorkspace(id!);
                            toast.success('Member removed');
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to remove member');
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInviteModal && id && (
        <InviteMemberModal
          workspaceId={id}
          onClose={() => {
            setShowInviteModal(false);
            loadWorkspace(id);
          }}
        />
      )}
    </div>
  );
}
