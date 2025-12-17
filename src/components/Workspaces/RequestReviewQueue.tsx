/**
 * Request Review Queue
 * Hiển thị pending reviews trong workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useRequestReviewStore, RequestReview } from '../../stores/requestReviewStore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import Select from '../UI/Select';
import { CheckCircle2, XCircle, AlertCircle, Clock, User, FileText } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';

export default function RequestReviewQueue() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const toast = useToast();
  const {
    reviews,
    loading,
    loadWorkspaceReviews,
    approveReview,
    rejectReview,
    requestChanges,
  } = useRequestReviewStore();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReviewer, setFilterReviewer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadReviewsWithErrorHandling();
    }
  }, [workspaceId, filterStatus, filterReviewer]);

  const loadReviewsWithErrorHandling = async () => {
    if (!workspaceId) return;
    setError(null);
    try {
      await loadWorkspaceReviews(workspaceId, {
        status: filterStatus || undefined,
        reviewer_id: filterReviewer || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    }
  };

  const pendingReviews = reviews.filter((r) => r.status === 'pending');
  const myPendingReviews = pendingReviews.filter((r) => r.reviewer_id === user?.id);
  const allReviews = filterStatus
    ? reviews.filter((r) => r.status === filterStatus)
    : reviews;

  const workspaceMembers = currentWorkspace
    ? [
        {
          id: currentWorkspace.owner_id.toString(),
          name: currentWorkspace.owner?.name || 'Owner',
        },
        ...(currentWorkspace.team_members || []).map((m: any) => ({
          id: m.user_id.toString(),
          name: m.user?.name || 'Member',
        })),
      ]
    : [];

  const handleQuickAction = async (review: RequestReview, action: 'approve' | 'reject' | 'changes') => {
    setActionLoading(review.id);
    try {
      if (action === 'approve') {
        await approveReview(review.id);
        toast.success('Review approved');
      } else if (action === 'reject') {
        await rejectReview(review.id, 'Rejected');
        toast.success('Review rejected');
      } else if (action === 'changes') {
        await requestChanges(review.id, 'Please make the requested changes');
        toast.success('Changes requested');
      }
      if (workspaceId) {
        await loadReviewsWithErrorHandling();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle2 size={12} />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm" className="flex items-center gap-1">
            <XCircle size={12} />
            Rejected
          </Badge>
        );
      case 'changes_requested':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <AlertCircle size={12} />
            Changes Requested
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm" className="flex items-center gap-1">
            <Clock size={12} />
            Pending
          </Badge>
        );
    }
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Review Queue
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {myPendingReviews.length > 0
              ? `${myPendingReviews.length} review${myPendingReviews.length !== 1 ? 's' : ''} pending your review`
              : 'All reviews are up to date'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: '', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'changes_requested', label: 'Changes Requested' },
          ]}
          className="w-48"
        />
        <Select
          value={filterReviewer}
          onChange={(e) => setFilterReviewer(e.target.value)}
          options={[
            { value: '', label: 'All Reviewers' },
            ...workspaceMembers.map((m) => ({
              value: m.id,
              label: m.name,
            })),
          ]}
          className="w-48"
        />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={loadReviewsWithErrorHandling}
          />
        </div>
      )}

      {loading && allReviews.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
              <Skeleton variant="text" lines={3} />
            </div>
          ))}
        </div>
      ) : allReviews.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No reviews found"
          description="No reviews match the current filters"
        />
      ) : (
        <div className="space-y-3">
          {allReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Request: {review.request_id}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Collection: {review.collection?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <User size={14} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Reviewer: {review.reviewer?.name || 'Unknown'}
                    </span>
                    {getStatusBadge(review.status)}
                  </div>
                </div>
                {review.status === 'pending' && review.reviewer_id === user?.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction(review, 'approve')}
                      className="text-green-600 dark:text-green-400"
                      disabled={actionLoading === review.id}
                    >
                      {actionLoading === review.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction(review, 'reject')}
                      className="text-red-600 dark:text-red-400"
                      disabled={actionLoading === review.id}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickAction(review, 'changes')}
                      className="text-orange-600 dark:text-orange-400"
                      disabled={actionLoading === review.id}
                    >
                      Request Changes
                    </Button>
                  </div>
                )}
              </div>
              {review.comments && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-2 bg-gray-50 dark:bg-gray-900/30 rounded">
                  {review.comments}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(review.created_at || '').toLocaleString()}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    // Navigate to request
                    navigate(`/?collection=${review.collection_id}&request=${review.request_id}`);
                  }}
                >
                  View Request
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
