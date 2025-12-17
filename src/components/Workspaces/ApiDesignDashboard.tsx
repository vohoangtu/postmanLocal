/**
 * API Design Dashboard
 * Dashboard tổng quan về API design trong workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { useRequestReviewStore } from '../../stores/requestReviewStore';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { BarChart3, FileText, CheckCircle2, Clock, AlertCircle, Plus, ArrowRight, Code2, GitBranch, Server, TestTube, Layers, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ApiDesignDashboard() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { collections } = useCollectionStore();
  const { reviews } = useRequestReviewStore();
  const toast = useToast();
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalCollections: 0,
    pendingReviews: 0,
    approvedRequests: 0,
    testCoverage: 0,
  });

  useEffect(() => {
    if (workspaceId) {
      loadStats();
    }
  }, [workspaceId, collections, reviews]);

  const loadStats = () => {
    const workspaceCollections = collections.filter(
      (c) => c.workspace_id?.toString() === workspaceId
    );

    const totalRequests = workspaceCollections.reduce(
      (sum, c) => sum + (c.requests?.length || 0),
      0
    );

    const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
    const approvedRequests = reviews.filter((r) => r.status === 'approved').length;

    setStats({
      totalRequests,
      totalCollections: workspaceCollections.length,
      pendingReviews,
      approvedRequests,
      testCoverage: totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0,
    });
  };

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            API Design Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overview of API design activities in this workspace
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Collection
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title={
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">Total Requests</span>
            </div>
          }
          className="bg-blue-50 dark:bg-blue-900/20"
        >
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-200 mt-2">
            {stats.totalRequests}
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Across {stats.totalCollections} collections
          </p>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-orange-600 dark:text-orange-400" />
              <span className="font-semibold">Pending Reviews</span>
            </div>
          }
          className="bg-orange-50 dark:bg-orange-900/20"
        >
          <div className="text-3xl font-bold text-orange-900 dark:text-orange-200 mt-2">
            {stats.pendingReviews}
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Awaiting approval
          </p>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
              <span className="font-semibold">Approved</span>
            </div>
          }
          className="bg-green-50 dark:bg-green-900/20"
        >
          <div className="text-3xl font-bold text-green-900 dark:text-green-200 mt-2">
            {stats.approvedRequests}
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Ready for use
          </p>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-600 dark:text-purple-400" />
              <span className="font-semibold">Test Coverage</span>
            </div>
          }
          className="bg-purple-50 dark:bg-purple-900/20"
        >
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-200 mt-2">
            {stats.testCoverage}%
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
            Of requests tested
          </p>
        </Card>
      </div>

      {/* Quick Actions - Chỉ hiển thị các actions thường dùng nhất */}
      <Card
        title="Quick Actions"
        className="bg-gray-50 dark:bg-gray-900/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Most Common Actions */}
          <Button
            variant="primary"
            onClick={() => navigate(`/workspace/${workspaceId}/collections`)}
            className="flex items-center justify-between p-4 h-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            <div className="flex items-center gap-2">
              <Plus size={18} />
              <span className="font-medium">New Collection</span>
            </div>
            <ArrowRight size={16} />
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/workspace/${workspaceId}/api-schema`)}
            className="flex items-center justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-2">
              <Code2 size={18} />
              <span>Schema Editor</span>
            </div>
            <ArrowRight size={16} />
          </Button>
          {stats.pendingReviews > 0 && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/workspace/${workspaceId}/reviews`)}
              className="flex items-center justify-between p-4 h-auto border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
            >
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-orange-600 dark:text-orange-400" />
                <span className="text-orange-800 dark:text-orange-200 font-medium">
                  Reviews ({stats.pendingReviews})
                </span>
              </div>
              <ArrowRight size={16} className="text-orange-600 dark:text-orange-400" />
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => navigate(`/workspace/${workspaceId}/documentation`)}
            className="flex items-center justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-2">
              <FileText size={18} />
              <span>Generate Docs</span>
            </div>
            <ArrowRight size={16} />
          </Button>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            More tools available in the sidebar →
          </p>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card
        title="Recent Activity"
        className="bg-gray-50 dark:bg-gray-900/30"
      >
        <div className="space-y-2">
          {stats.pendingReviews > 0 ? (
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-300 dark:border-orange-700">
              <AlertCircle size={16} className="text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-orange-800 dark:text-orange-200">
                {stats.pendingReviews} review{stats.pendingReviews !== 1 ? 's' : ''} pending your action
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/workspace/${workspaceId}/reviews`)}
                className="ml-auto"
              >
                View Reviews
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No pending reviews. All caught up!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
