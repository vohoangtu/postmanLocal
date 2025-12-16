/**
 * Discussion Thread Component
 * Hiển thị discussion thread với replies
 */

import { useState } from 'react';
import { Discussion, DiscussionReply } from '../../stores/discussionStore';
import { useDiscussionStore } from '../../stores/discussionStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { MessageSquare, Send, CheckCircle2, Circle, Trash2, Edit2, Reply } from 'lucide-react';

interface DiscussionThreadProps {
  discussion: Discussion;
  onClose?: () => void;
}

export default function DiscussionThread({ discussion, onClose }: DiscussionThreadProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const { addReply, resolveDiscussion, unresolveDiscussion, deleteDiscussion } = useDiscussionStore();
  const toast = useToast();
  
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleAddReply = async () => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      await addReply(discussion.id, replyContent);
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      if (discussion.resolved) {
        await unresolveDiscussion(discussion.id);
        toast.success('Discussion unresolved');
      } else {
        await resolveDiscussion(discussion.id);
        toast.success('Discussion resolved');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this discussion?')) return;
    setLoading(true);
    try {
      await deleteDiscussion(discussion.id);
      toast.success('Discussion deleted');
      onClose?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete discussion');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = permissions.canEdit || discussion.created_by === user?.id;
  const canDelete = permissions.canEdit || discussion.created_by === user?.id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-700 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {discussion.title}
            </h3>
            {discussion.resolved && (
              <Badge variant="primary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle2 size={12} className="mr-1" />
                Resolved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>by {discussion.creator?.name || 'Unknown'}</span>
            <span>•</span>
            <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResolve}
              disabled={loading}
              className="flex items-center gap-1"
            >
              {discussion.resolved ? (
                <>
                  <Circle size={14} />
                  Unresolve
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Resolve
                </>
              )}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 size={14} />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md">
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {discussion.content}
        </p>
      </div>

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="mb-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Replies ({discussion.replies.length})
          </h4>
          {discussion.replies.map((reply) => (
            <div
              key={reply.id}
              className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md border-l-2 border-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {reply.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {reply.user?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddReply();
                }
              }}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleAddReply}
            disabled={!replyContent.trim() || loading}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            Reply
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Press Ctrl+Enter to send
        </p>
      </div>
    </div>
  );
}
