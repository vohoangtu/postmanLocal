/**
 * Collection Tasks Component
 * Quản lý tasks trong collection
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTaskStore, Task } from '../../stores/taskStore';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import TaskCard from '../Workspaces/TaskCard';
import EmptyState from '../EmptyStates/EmptyState';
import { CheckSquare, Plus } from 'lucide-react';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';
import ErrorMessage from '../Error/ErrorMessage';
import Skeleton from '../UI/Skeleton';
import type { TaskFilters, CreateTaskFormData } from '../../types/workspace';

export default function CollectionTasks() {
  const { id: collectionId } = useParams<{ id: string }>();
  const {
    tasks,
    loading: tasksLoading,
    loadTasks,
    createTask,
    updateTask,
  } = useTaskStore();
  const toast = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: undefined,
    priority: undefined,
    assigned_to: undefined,
  });

  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    collection_id: collectionId || '',
    request_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
  });

  // Load tasks
  useEffect(() => {
    if (collectionId) {
      loadTasks(collectionId, filters);
    }
  }, [collectionId, filters, loadTasks]);

  const loading = tasksLoading;

  // Create task operation
  const {
    loading: creating,
    execute: executeCreateTask,
  } = useAsyncOperation<Task>(
    async () => {
      if (!formData.title.trim() || !collectionId) {
        throw new Error('Tiêu đề task và collection ID là bắt buộc');
      }

      const newTask = await createTask(collectionId, { ...formData, collection_id: collectionId });
      toast.success('Đã tạo task thành công');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        collection_id: collectionId || '',
        request_id: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      if (collectionId) {
        await loadTasks(collectionId, filters);
      }
      return newTask;
    },
    {
      onError: (error) => {
        toast.error(error.message || 'Không thể tạo task');
      },
    }
  );

  const handleCreateTask = () => {
    executeCreateTask();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      collection_id: task.collection_id || collectionId || '',
      request_id: task.request_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      due_date: task.due_date || '',
    });
    setShowCreateModal(true);
  };

  // Update task operation
  const {
    loading: updating,
    execute: executeUpdateTask,
  } = useAsyncOperation(
    async () => {
      if (!editingTask || !formData.title.trim()) {
        throw new Error('Task và tiêu đề là bắt buộc');
      }

      await updateTask(editingTask.id, formData);
      toast.success('Đã cập nhật task thành công');
      setShowCreateModal(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        collection_id: collectionId || '',
        request_id: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      if (collectionId) {
        await loadTasks(collectionId, filters);
      }
    },
    {
      onError: (error) => {
        toast.error(error.message || 'Không thể cập nhật task');
      },
    }
  );

  const handleUpdateTask = () => {
    executeUpdateTask();
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.assigned_to && task.assigned_to !== filters.assigned_to) return false;
      return true;
    });
  }, [tasks, filters]);

  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    done: filteredTasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and track collection tasks
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              collection_id: collectionId || '',
              request_id: '',
              assigned_to: '',
              priority: 'medium',
              due_date: '',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as Task['status'] })}
          options={[
            { value: '', label: 'All Status' },
            { value: 'todo', label: 'Todo' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'done', label: 'Done' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
        <Select
          label="Priority"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value as Task['priority'] })}
          options={[
            { value: '', label: 'All Priority' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
      </div>

      {loading && tasks.length === 0 ? (
        <div className="space-y-4">
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create tasks to track work and assignments"
          action={{
            label: 'Create Task',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Todo Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Todo ({tasksByStatus.todo.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.todo.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              In Progress ({tasksByStatus.in_progress.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.in_progress.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Done ({tasksByStatus.done.length})
            </h3>
            <div className="space-y-3">
              {tasksByStatus.done.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
          setFormData({
            title: '',
            description: '',
            collection_id: collectionId || '',
            request_id: '',
            assigned_to: '',
            priority: 'medium',
            due_date: '',
          });
        }}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingTask ? handleUpdateTask : handleCreateTask}
              disabled={creating || updating || !formData.title.trim()}
            >
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Task title"
            fullWidth
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Task description"
            rows={3}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
