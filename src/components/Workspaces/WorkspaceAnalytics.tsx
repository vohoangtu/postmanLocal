/**
 * Workspace Analytics Component
 * Hiển thị analytics và metrics cho team workspace
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { BarChart3, Users, FolderOpen, FileText, AlertCircle } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';
import Card from '../UI/Card';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../UI/ErrorMessage';

export default function WorkspaceAnalytics() {
  const { id } = useParams<{ id: string }>();
  const { 
    currentWorkspace, 
    loadWorkspace, 
    workspaceAnalytics, 
    loadWorkspaceAnalytics,
    loading,
    error 
  } = useWorkspaceStore();

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadWorkspaceAnalytics(id);
    }
  }, [id, loadWorkspace, loadWorkspaceAnalytics]);

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  const collections = currentWorkspace.collections || [];
  const members = currentWorkspace.team_members || [];
  const totalRequests = collections.reduce((sum, c) => {
    const requests = Array.isArray(c.requests) ? c.requests : [];
    return sum + requests.length;
  }, 0);

  const stats = [
    {
      label: 'Collections',
      value: collections.length,
      icon: FolderOpen,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Requests',
      value: totalRequests,
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Team Members',
      value: members.length + 1, // +1 for owner
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Overview of workspace activity and metrics
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={() => id && loadWorkspaceAnalytics(id)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton variant="text" lines={2} />
              </Card>
            ))}
          </div>
        </div>
      ) : !error ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <Icon size={32} className={stat.color} />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Additional Analytics */}
          {workspaceAnalytics ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detailed Analytics
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(workspaceAnalytics, null, 2)}
              </pre>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No analytics data yet"
              description="Analytics will be available as your team uses the workspace"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
