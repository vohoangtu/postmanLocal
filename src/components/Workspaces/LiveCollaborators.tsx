/**
 * Live Collaborators Component
 * Hiển thị collaborators đang active trong workspace
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePresenceStore } from '../../stores/presenceStore';
import { websocketService } from '../../services/websocketService';
import { Users, Eye, Edit2 } from 'lucide-react';

interface LiveCollaboratorsProps {
  entityType?: 'collection' | 'request';
  entityId?: string;
  entityName?: string;
}

export default function LiveCollaborators({
  entityType,
  entityId,
  entityName,
}: LiveCollaboratorsProps) {
  const { id } = useParams<{ id: string }>();
  const { getUsersByEntity, currentActivities } = usePresenceStore();
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    if (!entityType || !entityId) {
      setCollaborators([]);
      return;
    }

    const users = getUsersByEntity(entityType, entityId);
    setCollaborators(users);
  }, [entityType, entityId, currentActivities, getUsersByEntity]);

  // Note: Activity broadcasting would typically be done via API call to backend
  // Backend then broadcasts the event via WebSocket

  if (collaborators.length === 0) {
    return null;
  }

  const viewing = collaborators.filter((c) => c.currentAction?.type === 'viewing');
  const editing = collaborators.filter((c) => c.currentAction?.type === 'editing');

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
      <Users size={14} className="text-blue-600 dark:text-blue-400" />
      <div className="flex items-center gap-2">
        {editing.length > 0 && (
          <div className="flex items-center gap-1">
            <Edit2 size={12} className="text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {editing.length} editing
            </span>
          </div>
        )}
        {viewing.length > 0 && (
          <div className="flex items-center gap-1">
            <Eye size={12} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {viewing.length} viewing
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 -ml-1">
          {collaborators.slice(0, 3).map((collaborator) => (
            <div
              key={collaborator.id}
              className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
              title={collaborator.name || collaborator.email || 'User'}
            >
              {collaborator.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          ))}
          {collaborators.length > 3 && (
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
              +{collaborators.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
