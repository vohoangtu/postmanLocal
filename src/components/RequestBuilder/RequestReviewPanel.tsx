/**
 * Request Review Panel
 * Component hiển thị và quản lý reviews cho request
 */

import { useState, useEffect } from 'react';
import { useRequestReviewStore, RequestReview } from '../../stores/requestReviewStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { CheckCircle2, XCircle, AlertCircle, Clock, User, MessageSquare } from 'lucide-react';
import Select from '../UI/Select';
import Textarea from '../UI/Textarea';
import Modal from '../UI/Modal';

interface RequestReviewPanelProps {
  requestId: string;
  collectionId: string;
  workspaceId?: string;
}

export default function RequestReviewPanel({
  requestId,
  collectionId,
  workspaceId,
}: RequestReviewPanelProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const toast = useToast();
  const {
    reviews,
    loading,
    loadReviews,
    createReview,
    approveReview,
    rejectReview,
    requestChanges,
  } = useRequestReviewStore();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [actionReviewId, setActionReviewId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'changes' | null>(null);

  const effectiveWorkspaceId = workspaceId || currentWorkspace?.id?.toString();

  useEffect(() => {
    if (collectionId) {
      loadReviews(collectionId, { request_id: requestId });
    }
  }, [collectionId, requestId, loadReviews]);

  const requestReviews = reviews.filter((r) => r.request_id === requestId);
  const pendingReviews = requestReviews.filter((r) => r.status === 'pending');
  const myPendingReviews = pendingReviews.filter((r) => r.reviewer_id === user?.id);
  const myReviews = requestReviews.filter((r) => r.reviewer_id === user?.id);

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
      ].filter((m) => m.id !== user?.id)
    : [];

  const handleRequestReview = async () => {
    if (!selectedReviewer || !effectiveWorkspaceId) return;

    try {
      await createReview(requestId, collectionId, effectiveWorkspaceId, selectedReviewer, reviewComments);
      toast.success('Review request sent successfully');
      setShowRequestModal(false);
      setSelectedReviewer('');
      setReviewComments('');
      loadReviews(collectionId, { request_id: requestId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to request review');
    }
  };

  const handleAction = async () => {
    if (!actionReviewId || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approveReview(actionReviewId);
        toast.success('Review approved');
      } else if (actionType === 'reject') {
        await rejectReview(actionReviewId, reviewComments);
        toast.success('Review rejected');
      } else if (actionType === 'changes') {
        await requestChanges(actionReviewId, reviewComments);
        toast.success('Changes requested');
      }
      setActionReviewId(null);
      setActionType(null);
      setReviewComments('');
      loadReviews(collectionId, { request_id: requestId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update review');
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

  if (!effectiveWorkspaceId) {
    return null; // Chỉ hiển thị trong workspace context
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare size={18} />
          Reviews
        </h4>
        {workspaceMembers.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2"
          >
            Request Review
          </Button>
        )}
      </div>

      {loading && requestReviews.length === 0 ? (
        <div className="text-center text-gray-500 py-4">Loading reviews...</div>
      ) : requestReviews.length === 0 ? (
        <div className="text-center text-gray-500 py-4 text-sm">
          No reviews yet. Request a review to get feedback on this request.
        </div>
      ) : (
        <div className="space-y-3">
          {requestReviews.map((review) => (
            <div
              key={review.id}
              className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {review.reviewer?.name || 'Reviewer'}
                  </span>
                  {getStatusBadge(review.status)}
                </div>
                {review.reviewer_id === user?.id && review.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActionReviewId(review.id);
                        setActionType('approve');
                        handleAction();
                      }}
                      className="text-green-600 dark:text-green-400"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActionReviewId(review.id);
                        setActionType('reject');
                        setReviewComments('');
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActionReviewId(review.id);
                        setActionType('changes');
                        setReviewComments('');
                      }}
                      className="text-orange-600 dark:text-orange-400"
                    >
                      Request Changes
                    </Button>
                  </div>
                )}
              </div>
              {review.comments && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{review.comments}</p>
              )}
              {review.reviewed_at && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Reviewed {new Date(review.reviewed_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Request Review Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedReviewer('');
          setReviewComments('');
        }}
        title="Request Review"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reviewer
            </label>
            <Select
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              options={[
                { value: '', label: 'Select reviewer...' },
                ...workspaceMembers.map((m) => ({
                  value: m.id,
                  label: m.name,
                })),
              ]}
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comments (optional)
            </label>
            <Textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Add any comments or context for the reviewer..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowRequestModal(false);
                setSelectedReviewer('');
                setReviewComments('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestReview}
              disabled={!selectedReviewer}
            >
              Request Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action Modal (Reject/Request Changes) */}
      <Modal
        isOpen={!!actionReviewId && (actionType === 'reject' || actionType === 'changes')}
        onClose={() => {
          setActionReviewId(null);
          setActionType(null);
          setReviewComments('');
        }}
        title={actionType === 'reject' ? 'Reject Review' : 'Request Changes'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comments {actionType === 'changes' && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder={
                actionType === 'reject'
                  ? 'Explain why this request is rejected...'
                  : 'Describe what changes are needed...'
              }
              rows={4}
              required={actionType === 'changes'}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setActionReviewId(null);
                setActionType(null);
                setReviewComments('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' ? 'danger' : 'primary'}
              onClick={handleAction}
              disabled={actionType === 'changes' && !reviewComments.trim()}
            >
              {actionType === 'reject' ? 'Reject' : 'Request Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
