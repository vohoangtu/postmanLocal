/**
 * Workspace Live Activity Component
 * Real-time activity stream cho workspace
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { websocketService } from '../../services/websocketService';
import { useActivityStore, ActivityLog } from '../../stores/activityStore';
import { Clock, User, Folder, FileText, CheckCircle2, MessageSquare } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';

export default function WorkspaceLiveActivity() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const { activities, setActivities } = useActivityStore();
  const [liveActivities, setLiveActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<{ user?: string; action?: string }>({});

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
    }
  }, [id, loadWorkspace]);

  // Subscribe to real-time activity events
  useEffect(() => {
    if (!id) return;

    const unsubscribe = websocketService.subscribe(
      `private-workspace.${id}`,
      'activity.real-time',
      (data: any) => {
        const activity: ActivityLog = {
          id: data.id || Date.now().toString(),
          workspace_id: id,
          user_id: data.user_id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          metadata: data.metadata || { name: data.entity_name },
          created_at: data.created_at || new Date().toISOString(),
          user: data.user,
        };
        setLiveActivities((prev) => [activity, ...prev].slice(0, 50)); // Keep last 50
      }
    );

    return unsubscribe;
  }, [id]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '➕';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'shared':
        return '🔗';
      case 'commented':
        return '💬';
      case 'annotated':
        return '📝';
      case 'completed':
        return <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />;
      default:
        return '📌';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'updated':
        return 'text-blue-600 dark:text-blue-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      case 'shared':
        return 'text-purple-600 dark:text-purple-400';
      case 'commented':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  const filteredActivities = liveActivities.filter((activity) => {
    if (filter.user && activity.user_id !== filter.user) return false;
    if (filter.action && activity.action !== filter.action) return false;
    return true;
  });

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Live Activity
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time activity stream
          </p>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No live activities"
          description="Activities will appear here in real-time as team members work"
        />
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {activity.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.user?.name || 'Unknown'}
                    </span>
                    <span className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)} {activity.action}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.entity_type}
                    </span>
                  </div>
                  {activity.metadata?.name && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {activity.metadata.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} />
                    {formatTime(activity.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
