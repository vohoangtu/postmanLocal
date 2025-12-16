/**
 * Collaboration Sidebar Component
 * Collapsible sidebar với presence, active tasks, và recent discussions
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useTaskStore } from '../../stores/taskStore';
import { useDiscussionStore } from '../../stores/discussionStore';
import WorkspacePresence from './WorkspacePresence';
import { ChevronLeft, ChevronRight, CheckSquare, MessageSquare } from 'lucide-react';

interface CollaborationSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function CollaborationSidebar({ collapsed = false, onToggle }: CollaborationSidebarProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const { tasks, loadTasks } = useTaskStore();
  const { discussions, loadDiscussions } = useDiscussionStore();

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadTasks(id);
      loadDiscussions(id);
    }
  }, [id, loadWorkspace, loadTasks, loadDiscussions]);

  const activeTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'todo').slice(0, 5);
  const recentDiscussions = discussions.slice(0, 5);

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Collaboration
        </h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Presence */}
        <div>
          <WorkspacePresence compact={false} />
        </div>

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <CheckSquare size={14} />
                Active Tasks
              </h4>
              <button
                onClick={() => navigate(`/workspace/${id}/tasks`)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-1">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/workspace/${id}/tasks`)}
                  className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {task.title}
                  </p>
                  {task.assigned_user && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      → {task.assigned_user.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Discussions */}
        {recentDiscussions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <MessageSquare size={14} />
                Recent Discussions
              </h4>
              <button
                onClick={() => navigate(`/workspace/${id}/discussions`)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-1">
              {recentDiscussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => navigate(`/workspace/${id}/discussions`)}
                  className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {discussion.title}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {discussion.replies?.length || 0} replies
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
