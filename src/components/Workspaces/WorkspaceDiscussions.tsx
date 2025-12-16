/**
 * Workspace Discussions Component
 * Quản lý team discussions trong workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useDiscussionStore, Discussion } from '../../stores/discussionStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useToast } from '../../hooks/useToast';
import { websocketService } from '../../services/websocketService';
import Button from '../UI/Button';
import DiscussionThread from './DiscussionThread';
import EmptyState from '../EmptyStates/EmptyState';
import { MessageSquare, Plus, Filter, Loader2, CheckCircle2, Circle } from 'lucide-react';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';
import Badge from '../UI/Badge';

export default function WorkspaceDiscussions() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const {
    discussions,
    loading,
    loadDiscussions,
    createDiscussion,
  } = useDiscussionStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const toast = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [filterResolved, setFilterResolved] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadDiscussions(id, filterResolved ? { resolved: filterResolved === 'true' } : {});
    }
  }, [id, loadWorkspace, loadDiscussions]);

  useEffect(() => {
    if (id) {
      loadDiscussions(id, filterResolved ? { resolved: filterResolved === 'true' } : {});
    }
  }, [filterResolved, id, loadDiscussions]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!id) return;

    const unsubscribe = websocketService.subscribe(
      `private-workspace.${id}`,
      'discussion.created',
      () => {
        loadDiscussions(id, filterResolved ? { resolved: filterResolved === 'true' } : {});
      }
    );

    const unsubscribeReply = websocketService.subscribe(
      `private-workspace.${id}`,
      'discussion.replied',
      () => {
        loadDiscussions(id, filterResolved ? { resolved: filterResolved === 'true' } : {});
      }
    );

    return () => {
      unsubscribe();
      unsubscribeReply();
    };
  }, [id, filterResolved, loadDiscussions]);

  const handleCreateDiscussion = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !id) return;

    try {
      await createDiscussion(id, formData);
      toast.success('Discussion created successfully');
      setShowCreateModal(false);
      setFormData({ title: '', content: '' });
      loadDiscussions(id, filterResolved ? { resolved: filterResolved === 'true' } : {});
    } catch (error: any) {
      toast.error(error.message || 'Failed to create discussion');
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

  const filteredDiscussions = discussions.filter((d) => {
    if (filterResolved === 'true' && !d.resolved) return false;
    if (filterResolved === 'false' && d.resolved) return false;
    return true;
  });

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
            Team discussions and conversations
          </p>
        </div>
        {permissions.canEdit && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Discussion
          </Button>
        )}
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
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
              className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
              disabled={!formData.title.trim() || !formData.content.trim()}
            >
              Create
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
