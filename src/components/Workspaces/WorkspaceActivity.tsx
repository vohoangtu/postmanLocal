/**
 * Workspace Activity Component
 * Hiển thị activity logs cho team workspace
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useActivityStore, subscribeToActivities } from '../../stores/activityStore';
import ActivityFeed from '../Activity/ActivityFeed';
import { Activity } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';

export default function WorkspaceActivity() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const { 
    activities, 
    loadWorkspaceActivities, 
    loading, 
    error 
  } = useActivityStore();

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadWorkspaceActivities(id);
    }
  }, [id, loadWorkspace, loadWorkspaceActivities]);

  // Subscribe to real-time activity updates
  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToActivities(id);
    return unsubscribe;
  }, [id]);

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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Activity Log
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Recent activities in this workspace
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={() => id && loadWorkspaceActivities(id)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
              <Skeleton variant="text" lines={2} />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activities yet"
          description="Activities will appear here as team members work on collections and requests"
        />
      ) : (
        <ActivityFeed workspaceId={id} />
      )}
    </div>
  );
}
