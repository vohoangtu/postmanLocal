/**
 * API Design Review
 * Component quản lý design reviews
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useToast } from '../../hooks/useToast';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import * as apiDesignReviewService from '../../services/apiDesignReviewService';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';
import { CheckCircle2, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface DesignReview {
  id: string;
  schema_id: string;
  workspace_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  requested_by: { id: string; name: string };
  reviewer?: { id: string; name: string };
  schema: { id: string; name: string };
  created_at: string;
  reviewed_at?: string;
}

export default function ApiDesignReview() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  const [reviews, setReviews] = useState<apiDesignReviewService.ApiDesignReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadReviews();
    }
  }, [workspaceId, selectedStatus]);

  const loadReviews = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const reviewsData = await apiDesignReviewService.getWorkspaceDesignReviews(workspaceId);
      // Filter by status if needed
      const filtered = selectedStatus === 'all' 
        ? reviewsData 
        : reviewsData.filter(r => r.status === selectedStatus);
      setReviews(filtered);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load design reviews';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await apiDesignReviewService.approveDesignReview(reviewId);
      toast.success('Design approved');
      await loadReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve design');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    const comments = prompt('Enter rejection reason:');
    if (!comments) return;
    
    setActionLoading(reviewId);
    try {
      await apiDesignReviewService.rejectDesignReview(reviewId, comments);
      toast.success('Design rejected');
      await loadReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject design');
    } finally {
      setActionLoading(null);
    }
  };

    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/design-reviews/${reviewId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments }),
      });

      if (!response.ok) throw new Error('Failed to reject');

      toast.success('Design rejected');
      loadReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject design');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'changes_requested':
        return <Badge variant="warning">Changes Requested</Badge>;
      default:
        return <Badge variant="gray">Pending</Badge>;
    }
  };

  if (isLoading && reviews.length === 0) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton variant="text" lines={3} />
          </Card>
        ))}
      </div>
    );
  }

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
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Design Reviews</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Review and approve API designs
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected', 'changes_requested'].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </Button>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={loadReviews}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No reviews found
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              title={
                <div className="flex items-center gap-2">
                  <span>{review.schema?.name || 'Unknown Schema'}</span>
                  {getStatusBadge(review.status)}
                </div>
              }
            >
              <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <strong>Requested by:</strong> {review.requester?.name || 'Unknown'}
                  </div>
                  {review.reviewer && (
                    <div>
                      <strong>Reviewed by:</strong> {review.reviewer.name}
                    </div>
                  )}
                  <div>
                    <strong>Created:</strong>{' '}
                    {new Date(review.created_at).toLocaleString()}
                  </div>
                </div>
                {review.comments && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={16} className="text-gray-500 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {review.comments}
                      </p>
                    </div>
                  </div>
                )}
                {review.status === 'pending' && permissions.canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(review.id)}
                      className="flex items-center gap-1"
                      disabled={actionLoading === review.id}
                    >
                      <CheckCircle2 size={14} />
                      {actionLoading === review.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-1"
                      disabled={actionLoading === review.id}
                    >
                      <XCircle size={14} />
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRequestChanges(review.id)}
                      className="flex items-center gap-1"
                      disabled={actionLoading === review.id}
                    >
                      <AlertCircle size={14} />
                      Request Changes
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
