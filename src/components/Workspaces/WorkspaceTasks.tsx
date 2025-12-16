/**
 * Workspace Tasks Component
 * Quản lý tasks trong team workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTaskStore, Task } from '../../stores/taskStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useToast } from '../../hooks/useToast';
import { websocketService } from '../../services/websocketService';
import Button from '../UI/Button';
import TaskCard from './TaskCard';
import EmptyState from '../EmptyStates/EmptyState';
import { CheckSquare, Plus, Filter, Loader2 } from 'lucide-react';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';

export default function WorkspaceTasks() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const {
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTask,
  } = useTaskStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const toast = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    collection_id: '',
    request_id: '',
    assigned_to: '',
    priority: 'medium' as Task['priority'],
    due_date: '',
  });

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadTasks(id, filters);
    }
  }, [id, loadWorkspace, loadTasks]);

  // Subscribe to real-time task updates
  useEffect(() => {
    if (!id) return;

    const unsubscribe = websocketService.subscribe(
      `private-workspace.${id}`,
      'task.created',
      () => {
        loadTasks(id, filters);
      }
    );

    const unsubscribeUpdate = websocketService.subscribe(
      `private-workspace.${id}`,
      'task.updated',
      () => {
        loadTasks(id, filters);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUpdate();
    };
  }, [id, filters, loadTasks]);

  useEffect(() => {
    if (id) {
      loadTasks(id, filters);
    }
  }, [filters, id, loadTasks]);

  const handleCreateTask = async () => {
    if (!formData.title.trim() || !id) return;

    try {
      await createTask(id, formData);
      toast.success('Task created successfully');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        collection_id: '',
        request_id: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      loadTasks(id, filters);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      collection_id: task.collection_id || '',
      request_id: task.request_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      due_date: task.due_date || '',
    });
    setShowCreateModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title.trim()) return;

    try {
      await updateTask(editingTask.id, formData);
      toast.success('Task updated successfully');
      setShowCreateModal(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        collection_id: '',
        request_id: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      loadTasks(id!, filters);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
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

  const teamMembers = currentWorkspace.team_members || [];
  const allMembers = [
    { id: currentWorkspace.owner_id.toString(), name: currentWorkspace.owner?.name || 'Owner', email: currentWorkspace.owner?.email },
    ...teamMembers.map((m) => ({
      id: m.user_id.toString(),
      name: m.user?.name || 'User',
      email: m.user?.email,
    })),
  ];

  const filteredTasks = tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assigned_to && task.assigned_to !== filters.assigned_to) return false;
    return true;
  });

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
            Manage and track team tasks
          </p>
        </div>
        {permissions.canEdit && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingTask(null);
              setFormData({
                title: '',
                description: '',
                collection_id: '',
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
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          options={[
            { value: '', label: 'All Priority' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
        <Select
          label="Assigned To"
          value={filters.assigned_to}
          onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
          options={[
            { value: '', label: 'All Members' },
            ...allMembers.map((m) => ({
              value: m.id,
              label: m.name,
            })),
          ]}
        />
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create tasks to track work and assignments"
          action={
            permissions.canEdit
              ? {
                  label: 'Create Task',
                  onClick: () => setShowCreateModal(true),
                }
              : undefined
          }
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
            collection_id: '',
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
              disabled={!formData.title.trim()}
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
                className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <Select
            label="Assign To"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            options={[
              { value: '', label: 'Unassigned' },
              ...allMembers.map((m) => ({
                value: m.id,
                label: m.name,
              })),
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
