/**
 * Collection Permissions Modal
 * Quản lý permissions của collection trong workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Select from '../UI/Select';
import { X, User, Shield, Lock } from 'lucide-react';

interface CollectionPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
}

interface Permission {
  id?: string;
  user_id: string;
  permission: 'read' | 'write' | 'admin';
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function CollectionPermissionsModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
}: CollectionPermissionsModalProps) {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const toast = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadPermissions();
    }
  }, [isOpen, workspaceId, collectionId]);

  const loadPermissions = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections/${collectionId}/workspaces/${workspaceId}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (userId: string, newPermission: 'read' | 'write' | 'admin') => {
    setPermissions((prev) =>
      prev.map((p) => (p.user_id === userId ? { ...p, permission: newPermission } : p))
    );
  };

  const handleAddUser = () => {
    // Get workspace members
    const allMembers = currentWorkspace
      ? [
          { id: currentWorkspace.owner_id.toString(), name: currentWorkspace.owner?.name || 'Owner' },
          ...(currentWorkspace.team_members || []).map((m: any) => ({
            id: m.user_id.toString(),
            name: m.user?.name || 'Member',
          })),
        ]
      : [];

    // Find a member not already in permissions
    const availableMember = allMembers.find(
      (m) => !permissions.some((p) => p.user_id === m.id)
    );

    if (availableMember) {
      setPermissions([
        ...permissions,
        {
          user_id: availableMember.id,
          permission: 'read',
          user: { id: availableMember.id, name: availableMember.name, email: '' },
        },
      ]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setPermissions((prev) => prev.filter((p) => p.user_id !== userId));
  };

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections/${collectionId}/workspaces/${workspaceId}/permissions`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            permissions: permissions.map((p) => ({
              user_id: p.user_id,
              permission: p.permission,
            })),
          }),
        }
      );

      if (response.ok) {
        toast.success('Permissions updated successfully');
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update permissions');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const allMembers = currentWorkspace
    ? [
        { id: currentWorkspace.owner_id.toString(), name: currentWorkspace.owner?.name || 'Owner' },
        ...(currentWorkspace.team_members || []).map((m: any) => ({
          id: m.user_id.toString(),
          name: m.user?.name || 'Member',
        })),
      ]
    : [];

  const availableMembers = allMembers.filter(
    (m) => !permissions.some((p) => p.user_id === m.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-300 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Collection Permissions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{collectionName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading permissions...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No specific permissions set. All workspace members have default access.
                </div>
              ) : (
                permissions.map((permission) => (
                  <div
                    key={permission.user_id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {permission.user?.name || 'User'}
                        </span>
                      </div>
                    </div>
                    <Select
                      value={permission.permission}
                      onChange={(e) =>
                        handlePermissionChange(
                          permission.user_id,
                          e.target.value as 'read' | 'write' | 'admin'
                        )
                      }
                      options={[
                        { value: 'read', label: 'Read' },
                        { value: 'write', label: 'Write' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(permission.user_id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}

              {availableMembers.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleAddUser}
                  className="w-full mt-4"
                >
                  + Add User Permission
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end p-6 border-t-2 border-gray-300 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
}
