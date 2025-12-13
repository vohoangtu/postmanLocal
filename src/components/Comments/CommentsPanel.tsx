import { useState, useEffect } from "react";
import { Send, Reply, Edit2, Trash2 } from "lucide-react";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";
import { websocketService } from "../../services/websocketService";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  replies?: Comment[];
}

interface CommentsPanelProps {
  collectionId: string;
}

export default function CommentsPanel({ collectionId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadComments();

    // Subscribe to real-time comment updates
    const unsubscribe = websocketService.subscribe(
      `private-collection.${collectionId}`,
      "comment.created",
      (data: any) => {
        // Reload comments when new comment is created
        loadComments();
        toast.info(`New comment from ${data.comment?.user?.name || "Someone"}`);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [collectionId]);

  const loadComments = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment,
            parent_id: replyingTo || null,
          }),
        }
      );

      if (response.ok) {
        toast.success("Comment added");
        setNewComment("");
        setReplyingTo(null);
        await loadComments();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add comment");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/comments/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: editContent }),
        }
      );

      if (response.ok) {
        toast.success("Comment updated");
        setEditingId(null);
        setEditContent("");
        await loadComments();
      } else {
        toast.error("Failed to update comment");
      }
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa comment này?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/comments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Comment deleted");
        await loadComments();
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const currentUserId = localStorage.getItem("user_id");

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Comments
      </h3>

      {/* Comment Input */}
      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          rows={3}
        />
        <div className="flex items-center justify-between">
          {replyingTo && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Replying to comment
            </span>
          )}
          <div className="flex gap-2">
            {replyingTo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitComment}
              disabled={loading || !newComment.trim()}
            >
              <Send size={14} className="mr-1" />
              {replyingTo ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={() => setReplyingTo(comment.id)}
            onEdit={() => startEdit(comment)}
            onDelete={() => handleDeleteComment(comment.id)}
            editingId={editingId}
            editContent={editContent}
            onEditChange={setEditContent}
            onSaveEdit={() => handleEditComment(comment.id)}
            onCancelEdit={() => {
              setEditingId(null);
              setEditContent("");
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  editingId,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: {
  comment: Comment;
  currentUserId: string | null;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  editingId: string | null;
  editContent: string;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const isEditing = editingId === comment.id;
  const isOwner = comment.user_id === currentUserId;

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {comment.user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.user?.name || "Unknown"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={onSaveEdit}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={onReply}>
                  <Reply size={12} className="mr-1" />
                  Reply
                </Button>
                {isOwner && (
                  <>
                    <Button variant="ghost" size="sm" onClick={onEdit}>
                      <Edit2 size={12} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDelete}>
                      <Trash2 size={12} className="mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  editingId={editingId}
                  editContent={editContent}
                  onEditChange={onEditChange}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


