/**
 * Collection Discussions Component
 * Quản lý discussions trong collection
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDiscussionStore, Discussion } from '../../stores/discussionStore';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import DiscussionThread from '../Workspaces/DiscussionThread';
import EmptyState from '../EmptyStates/EmptyState';
import { MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';
import Badge from '../UI/Badge';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';
import type { DiscussionFilters, CreateDiscussionFormData } from '../../types/workspace';

export default function CollectionDiscussions() {
  const { id: collectionId } = useParams<{ id: string }>();
  const {
    discussions,
    loading: discussionsLoading,
    loadDiscussions,
    createDiscussion,
  } = useDiscussionStore();
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

  // Load discussions
  useEffect(() => {
    if (collectionId) {
      loadDiscussions(collectionId, discussionFilters);
    }
  }, [collectionId, discussionFilters, loadDiscussions]);

  const loading = discussionsLoading;

  // Create discussion operation
  const {
    loading: creating,
    execute: executeCreateDiscussion,
  } = useAsyncOperation<Discussion>(
    async () => {
      if (!formData.title.trim() || !formData.content.trim() || !collectionId) {
        throw new Error('Tiêu đề và nội dung discussion là bắt buộc');
      }

      const newDiscussion = await createDiscussion(collectionId, formData);
      toast.success('Đã tạo discussion thành công');
      setShowCreateModal(false);
      setFormData({ title: '', content: '' });
      if (collectionId) {
        await loadDiscussions(collectionId, discussionFilters);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Discussions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Collection discussions and conversations
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Discussion
        </Button>
      </div>

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
          description="Start a discussion to collaborate"
          action={{
            label: 'Create Discussion',
            onClick: () => setShowCreateModal(true),
          }}
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
