/**
 * Workspace Presence Component
 * Hiển thị ai đang online trong workspace và current activities
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePresenceStore } from '../../stores/presenceStore';
import { usePresenceChannel } from '../../hooks/useWebSocket';
import { websocketService } from '../../services/websocketService';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Circle, Eye, Edit2, Clock } from 'lucide-react';

interface WorkspacePresenceProps {
  compact?: boolean;
}

export default function WorkspacePresence({ compact = false }: WorkspacePresenceProps) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    onlineUsers,
    currentActivities,
    setOnlineUsers,
    addUser,
    removeUser,
    updateUserActivity,
  } = usePresenceStore();

  // Subscribe to presence channel
  const { connected } = usePresenceChannel(
    `presence-workspace.${id}`,
    {
      here: (users) => {
        setOnlineUsers(users);
      },
      joining: (joinedUser) => {
        addUser(joinedUser);
      },
      leaving: (leftUser) => {
        removeUser(leftUser.id);
      },
    },
    !!id
  );

  // Listen for activity events
  useEffect(() => {
    if (!connected || !id) return;

    const unsubscribe = websocketService.subscribe(
      `private-workspace.${id}`,
      'user.activity',
      (data: any) => {
        updateUserActivity(data.user_id, {
          type: data.action,
          entityType: data.entity_type,
          entityId: data.entity_id,
          entityName: data.entity_name,
        });
      }
    );

    return unsubscribe;
  }, [connected, id, updateUserActivity]);

  // Also listen to presence channel for user joined/left
  useEffect(() => {
    if (!connected || !id) return;

    // Presence updates are handled by usePresenceChannel hook
    // This is just for activity tracking
  }, [connected, id]);

  // Note: Activity broadcasting would typically be done via API call to backend
  // Backend then broadcasts the event via WebSocket

  const onlineUsersArray = Array.from(onlineUsers.values());
  const activeUsers = Array.from(currentActivities.values());

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {onlineUsersArray.slice(0, 3).map((onlineUser) => {
            const isActive = currentActivities.has(onlineUser.id);
            return (
              <div
                key={onlineUser.id}
                className="relative"
                title={`${onlineUser.name || onlineUser.email || 'User'}${isActive ? ` - ${onlineUser.currentAction?.type}` : ''}`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                  {onlineUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <Circle
                  size={8}
                  className={`absolute -bottom-0 -right-0 ${
                    isActive ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                  }`}
                />
              </div>
            );
          })}
          {onlineUsersArray.length > 3 && (
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
              +{onlineUsersArray.length - 3}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Online ({onlineUsersArray.length})
          </h3>
        </div>
        {connected && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Circle size={6} className="fill-current" />
            Live
          </div>
        )}
      </div>

      {onlineUsersArray.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
          No one online
        </p>
      ) : (
        <div className="space-y-2">
          {onlineUsersArray.map((onlineUser) => {
            const activity = onlineUser.currentAction;
            const isActive = currentActivities.has(onlineUser.id);

            return (
              <div
                key={onlineUser.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {onlineUser.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <Circle
                      size={8}
                      className={`absolute -bottom-0 -right-0 ${
                        isActive ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {onlineUser.name || onlineUser.email || 'User'}
                    </p>
                    {activity && activity.type !== 'idle' && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        {activity.type === 'viewing' ? (
                          <Eye size={12} />
                        ) : activity.type === 'editing' ? (
                          <Edit2 size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span className="truncate">
                          {activity.type} {activity.entityName || activity.entityType}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeUsers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Active Now
          </h4>
          <div className="space-y-1">
            {activeUsers.map((activeUser) => (
              <div
                key={activeUser.id}
                className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
              >
                <span className="font-medium">{activeUser.name || 'User'}</span>
                <span>is {activeUser.currentAction?.type}</span>
                {activeUser.currentAction?.entityName && (
                  <span className="text-gray-500">{activeUser.currentAction.entityName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
