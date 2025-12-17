/**
 * Workspace Discussions Component
 * Quản lý team discussions trong workspace
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDiscussionStore, Discussion } from '../../stores/discussionStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspaceWebSocket } from '../../hooks/useWorkspaceWebSocket';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import DiscussionThread from './DiscussionThread';
import EmptyState from '../EmptyStates/EmptyState';
import PageLayout from '../Layout/PageLayout';
import PageToolbar from '../Layout/PageToolbar';
import { MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';
import Badge from '../UI/Badge';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';
import type { DiscussionFilters, CreateDiscussionFormData } from '../../types/workspace';

export default function WorkspaceDiscussions() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { workspace, loading: workspaceLoading, error: workspaceError } = useWorkspaceData(workspaceId);
  const {
    discussions,
    loading: discussionsLoading,
    loadDiscussions,
    createDiscussion,
  } = useDiscussionStore();
  const permissions = useWorkspacePermission(workspace);
  const toast = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [filterResolved, setFilterResolved] = useState<string>('');

  const [formData, setFormData] = useState<CreateDiscussionFormData>({
    title: '',
    content: '',
  });

  // Discussion filters
  const discussionFilters = useMemo<DiscussionFilters>(() => {
    return filterResolved ? { resolved: filterResolved === 'true' } : {};
  }, [filterResolved]);

  // Load discussions operation
  const {
    loading: loadingDiscussions,
    error: discussionsError,
    execute: loadDiscussionsWithErrorHandling,
  } = useAsyncOperation(
    async () => {
      if (!workspaceId) throw new Error('Workspace ID không hợp lệ');
      await loadDiscussions(workspaceId, discussionFilters);
    },
    {
      onError: (error) => {
        console.error('Failed to load discussions:', error);
      },
    }
  );

  useEffect(() => {
    if (workspaceId) {
      loadDiscussionsWithErrorHandling();
    }
  }, [workspaceId, discussionFilters, loadDiscussionsWithErrorHandling]);

  // Subscribe to real-time updates
  useWorkspaceWebSocket(
    workspaceId,
    useMemo(
      () => [
        {
          channel: `private-workspace.${workspaceId || ''}`,
          event: 'discussion.created',
          handler: () => {
            if (workspaceId) {
              loadDiscussions(workspaceId, discussionFilters);
            }
          },
        },
        {
          channel: `private-workspace.${workspaceId || ''}`,
          event: 'discussion.replied',
          handler: () => {
            if (workspaceId) {
              loadDiscussions(workspaceId, discussionFilters);
            }
          },
        },
      ],
      [workspaceId, discussionFilters, loadDiscussions]
    )
  );

  const loading = workspaceLoading || discussionsLoading || loadingDiscussions;
  const error = workspaceError || discussionsError;

  // Create discussion operation
  const {
    loading: creating,
    execute: executeCreateDiscussion,
  } = useAsyncOperation<Discussion>(
    async () => {
      if (!formData.title.trim() || !formData.content.trim() || !workspaceId) {
        throw new Error('Tiêu đề và nội dung discussion là bắt buộc');
      }

      const newDiscussion = await createDiscussion(workspaceId, formData);
      toast.success('Đã tạo discussion thành công');
      setShowCreateModal(false);
      setFormData({ title: '', content: '' });
      if (workspaceId) {
        await loadDiscussions(workspaceId, discussionFilters);
      }
      return newDiscussion;
    },
    {
      onError: (error) => {
        toast.error(error.message || 'Không thể tạo discussion');
      },
    }
  );

  const handleCreateDiscussion = () => {
    executeCreateDiscussion();
  };

  if (!workspace || !workspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Workspace này không phải là team workspace.
        </div>
      </div>
    );
  }

  const filteredDiscussions = useMemo(() => {
    return discussions.filter((d) => {
      if (filterResolved === 'true' && !d.resolved) return false;
      if (filterResolved === 'false' && d.resolved) return false;
      return true;
    });
  }, [discussions, filterResolved]);

  if (selectedDiscussion) {
    return (
      <div className="p-6">
        <DiscussionThread
          discussion={selectedDiscussion}
          onClose={() => setSelectedDiscussion(null)}
        />
      </div>
    );
  }

  const renderToolbar = useCallback(() => {
    return (
      <PageToolbar
        leftSection={
          <>
            <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Discussions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''} • Team discussions and conversations
              </p>
            </div>
          </>
        }
        rightSection={
          permissions.canEdit && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Discussion
            </Button>
          )
        }
      >
        {/* Toolbar content */}
      </PageToolbar>
    );
  }, [filteredDiscussions.length, permissions.canEdit]);

  return (
    <>
      <PageLayout toolbar={renderToolbar()}>
        {/* Filter */}
        <div className="mb-6">
          <Select
            label="Filter"
            value={filterResolved}
            onChange={(e) => setFilterResolved(e.target.value)}
            options={[
              { value: '', label: 'All Discussions' },
              { value: 'false', label: 'Open' },
              { value: 'true', label: 'Resolved' },
            ]}
            className="w-48"
          />
        </div>

        {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={() => loadDiscussionsWithErrorHandling()}
          />
        </div>
      )}

      {loading && discussions.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
              <Skeleton variant="text" lines={2} />
            </div>
          ))}
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussions yet"
          description="Start a discussion to collaborate with your team"
          action={
            permissions.canEdit
              ? {
                  label: 'Create Discussion',
                  onClick: () => setShowCreateModal(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              onClick={() => setSelectedDiscussion(discussion)}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {discussion.title}
                    </h4>
                    {discussion.resolved && (
                      <Badge variant="primary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle2 size={10} className="mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {discussion.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span>by {discussion.creator?.name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                  {discussion.replies && discussion.replies.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{discussion.replies.length} replies</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </PageLayout>

      {/* Create Discussion Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ title: '', content: '' });
        }}
        title="Create New Discussion"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ title: '', content: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDiscussion}
              disabled={!formData.title.trim() || !formData.content.trim() || creating}
            >
              {creating ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Discussion title"
            fullWidth
            required
            autoFocus
          />
          <Textarea
            label="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="What would you like to discuss?"
            rows={5}
            fullWidth
            required
          />
        </div>
      </Modal>
    </div>
  );
}
