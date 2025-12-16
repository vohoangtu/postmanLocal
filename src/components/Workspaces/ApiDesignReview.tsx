/**
 * API Design Review
 * Component quản lý design reviews
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useToast } from '../../hooks/useToast';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { authService } from '../../services/authService';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { CheckCircle2, XCircle, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

  const [reviews, setReviews] = useState<DesignReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (workspaceId) {
      loadReviews();
    }
  }, [workspaceId, selectedStatus]);

  const loadReviews = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const url = new URL(`${API_BASE_URL}/workspaces/${workspaceId}/design-reviews`);
      if (selectedStatus !== 'all') {
        url.searchParams.set('status', selectedStatus);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load reviews');

      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/design-reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments: '' }),
      });

      if (!response.ok) throw new Error('Failed to approve');

      toast.success('Design approved');
      loadReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve design');
    }
  };

  const handleReject = async (reviewId: string) => {
    const comments = prompt('Enter rejection reason:');
    if (!comments) return;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={32} />
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
                  <span>{review.schema.name}</span>
                  {getStatusBadge(review.status)}
                </div>
              }
            >
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <strong>Requested by:</strong> {review.requested_by.name}
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
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border-2 border-gray-200 dark:border-gray-700">
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
                    >
                      <CheckCircle2 size={14} />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(review.id)}
                      className="flex items-center gap-1"
                    >
                      <XCircle size={14} />
                      Reject
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
