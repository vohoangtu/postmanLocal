/**
 * Workspace Activity Component
 * Hiển thị activity logs cho team workspace
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useActivityStore } from '../../stores/activityStore';
import ActivityFeed from '../Activity/ActivityFeed';
import { Activity, Loader2 } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';

export default function WorkspaceActivity() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace, workspaceActivities, loadWorkspaceActivities } = useWorkspaceStore();
  const { activities, setActivities } = useActivityStore();

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadWorkspaceActivities(id);
    }
  }, [id, loadWorkspace, loadWorkspaceActivities]);

  useEffect(() => {
    if (workspaceActivities.length > 0) {
      setActivities(workspaceActivities);
    }
  }, [workspaceActivities, setActivities]);

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

      {activities.length === 0 ? (
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
