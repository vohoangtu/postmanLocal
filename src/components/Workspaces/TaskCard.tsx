/**
 * Task Card Component
 * Hiển thị task card với thông tin và actions
 */

import { Task } from '../../stores/taskStore';
import { useTaskStore } from '../../stores/taskStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { CheckCircle2, Circle, Clock, User, Trash2, Edit2, Calendar } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const { updateTask, deleteTask, completeTask } = useTaskStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Circle size={16} className="text-blue-600 dark:text-blue-400 fill-current" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    setLoading(true);
    try {
      await updateTask(task.id, { status: newStatus });
      toast.success('Task updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    setLoading(true);
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeTask(task.id);
      toast.success('Task completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${
      isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'
    } p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={() => {
              if (task.status === 'done') {
                handleStatusChange('todo');
              } else {
                handleComplete();
              }
            }}
            disabled={loading}
            className="flex-shrink-0 mt-0.5"
          >
            {getStatusIcon(task.status)}
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (permissions.canEdit || task.created_by === user?.id) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="p-1"
            >
              <Edit2 size={14} />
            </Button>
          )}
          {(permissions.canEdit || task.created_by === user?.id) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="p-1 text-red-600 dark:text-red-400"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge variant="secondary" className={getStatusColor(task.status)}>
          {task.status.replace('_', ' ')}
        </Badge>
        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
        {task.collection && (
          <Badge variant="secondary" className="text-xs">
            {task.collection.name}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-3">
          {task.assigned_user && (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{task.assigned_user.name}</span>
            </div>
          )}
          {task.due_date && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
              <Calendar size={12} />
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="text-gray-500 dark:text-gray-500">
          {new Date(task.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
