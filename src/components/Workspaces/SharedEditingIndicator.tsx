/**
 * Shared Editing Indicator Component
 * Hiển thị khi có người đang edit collection/request
 */

import { useEffect, useState } from 'react';
import { usePresenceStore } from '../../stores/presenceStore';
import { AlertTriangle, Lock, Users } from 'lucide-react';
import Badge from '../UI/Badge';

interface SharedEditingIndicatorProps {
  entityType: 'collection' | 'request';
  entityId: string;
  entityName?: string;
}

export default function SharedEditingIndicator({
  entityType,
  entityId,
  entityName,
}: SharedEditingIndicatorProps) {
  const { getUsersByEntity, currentActivities } = usePresenceStore();
  const [editingUsers, setEditingUsers] = useState<any[]>([]);
  const [viewingUsers, setViewingUsers] = useState<any[]>([]);

  useEffect(() => {
    const users = getUsersByEntity(entityType, entityId);
    setEditingUsers(users.filter((u) => u.currentAction?.type === 'editing'));
    setViewingUsers(users.filter((u) => u.currentAction?.type === 'viewing'));
  }, [entityType, entityId, currentActivities, getUsersByEntity]);

  if (editingUsers.length === 0 && viewingUsers.length === 0) {
    return null;
  }

  const hasConflict = editingUsers.length > 1;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
      hasConflict
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
    }`}>
      {hasConflict && (
        <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
      )}
      {!hasConflict && editingUsers.length > 0 && (
        <Lock size={16} className="text-blue-600 dark:text-blue-400" />
      )}
      {viewingUsers.length > 0 && editingUsers.length === 0 && (
        <Users size={16} className="text-blue-600 dark:text-blue-400" />
      )}
      <div className="flex-1">
        {hasConflict && (
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
            Multiple users editing - potential conflicts
          </p>
        )}
        {!hasConflict && editingUsers.length > 0 && (
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {editingUsers[0].name || 'Someone'} is editing {entityName || entityType}
          </p>
        )}
        {viewingUsers.length > 0 && editingUsers.length === 0 && (
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {viewingUsers.length} {viewingUsers.length === 1 ? 'person is' : 'people are'} viewing
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {editingUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-medium border border-white dark:border-gray-800"
            title={user.name || user.email || 'User'}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        ))}
        {viewingUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border border-white dark:border-gray-800"
            title={user.name || user.email || 'User'}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        ))}
      </div>
    </div>
  );
}
