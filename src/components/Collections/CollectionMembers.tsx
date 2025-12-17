/**
 * Collection Members Component
 * Quản lý permissions cho collection
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { Users, Plus } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';
import apiClient from '../../services/apiClient';
import type { User } from '../../types/workspace';

interface CollectionPermission {
  id: string;
  collection_id: string;
  user_id: string;
  permission: 'read' | 'write' | 'admin';
  user?: User;
}

export default function CollectionMembers() {
  const { id: collectionId } = useParams<{ id: string }>();
  const [permissions, setPermissions] = useState<CollectionPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const toast = useToast();

  const loadPermissions = async () => {
    if (!collectionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<CollectionPermission[]>(`/collections/${collectionId}/permissions`);
      setPermissions(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [collectionId]);

  const {
    execute: executeRemovePermission,
  } = useAsyncOperation(
    async (userId: string) => {
      if (!collectionId) throw new Error('Collection ID không hợp lệ');
      await apiClient.delete(`/collections/${collectionId}/permissions/${userId}`);
      await loadPermissions();
      toast.success('Đã xóa permission thành công');
    },
    {
      onError: (error) => {
        toast.error(error.message || 'Không thể xóa permission');
      },
    }
  );

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'write':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'read':
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
            Collection Members
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {permissions.length} member{permissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <Plus size={16} />
          Add Member
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={() => loadPermissions()}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="card" height={80} />
          <Skeleton variant="card" height={80} />
        </div>
      ) : permissions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add members to share this collection"
          action={{
            label: 'Add Member',
            onClick: () => setShowInviteModal(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {permissions.map((perm) => (
            <div
              key={perm.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {perm.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {perm.user?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {perm.user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getPermissionBadgeColor(perm.permission)}>
                    {perm.permission}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!confirm(`Xóa ${perm.user?.name} khỏi collection?`)) return;
                      await executeRemovePermission(perm.user_id);
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TODO: Add InviteMemberModal for collections */}
    </div>
  );
}
