/**
 * Workspace Settings Component
 * Quản lý workspace settings
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { 
  getWorkspaceEnvironments, 
  createWorkspaceEnvironment, 
  updateEnvironment, 
  deleteEnvironment,
  Environment 
} from '../../services/environmentService';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Textarea from '../UI/Textarea';
import Card from '../UI/Card';
import { Settings, Save, Trash2, Download, AlertTriangle, Plus, Edit2, X, Environment as EnvIcon } from 'lucide-react';

export default function WorkspaceSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace, loadWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const { workspaceEnvironments, setWorkspaceEnvironments, addEnvironment, updateEnvironment: updateEnvInStore, deleteEnvironment: deleteEnvInStore } = useEnvironmentStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const toast = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Environment states
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loadingEnvs, setLoadingEnvs] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [envName, setEnvName] = useState('');
  const [envVariables, setEnvVariables] = useState<Array<{ key: string; value: string; enabled: boolean }>>([
    { key: '', value: '', enabled: true }
  ]);

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadEnvironments();
    }
  }, [id, loadWorkspace]);

  const loadEnvironments = async () => {
    if (!id) return;
    setLoadingEnvs(true);
    try {
      const envs = await getWorkspaceEnvironments(id);
      setEnvironments(envs);
      setWorkspaceEnvironments(envs);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load environments');
    } finally {
      setLoadingEnvs(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || '');
      setDescription(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  const handleSave = async () => {
    if (!id || !permissions.canEdit) return;

    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        updateWorkspace(id, updated);
        toast.success('Workspace updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update workspace');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !permissions.canDelete) return;

    setLoading(true);
    try {
      await deleteWorkspace(id);
      toast.success('Workspace deleted successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workspace');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExport = async () => {
    if (!currentWorkspace) return;

    try {
      const exportData = {
        workspace: currentWorkspace,
        exported_at: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentWorkspace.name}_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Workspace exported successfully');
    } catch (error: any) {
      toast.error('Failed to export workspace');
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading workspace settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage workspace settings and preferences
        </p>
      </div>

      {/* General Settings */}
      <Card title="General Settings">
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!permissions.canEdit}
            fullWidth
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!permissions.canEdit}
            rows={3}
            fullWidth
          />
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!permissions.canEdit || loading}
              loading={loading}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Environments */}
      <Card title="Environments">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage environments for this workspace. All collections in this workspace will use these environments.
            </p>
            {permissions.canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingEnv(null);
                  setEnvName('');
                  setEnvVariables([{ key: '', value: '', enabled: true }]);
                  setShowEnvModal(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                New Environment
              </Button>
            )}
          </div>

          {loadingEnvs ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading environments...
            </div>
          ) : environments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <EnvIcon size={48} className="mx-auto mb-2 opacity-50" />
              <p>No environments yet</p>
              <p className="text-sm mt-1">Create an environment to manage variables for this workspace</p>
            </div>
          ) : (
            <div className="space-y-2">
              {environments.map((env) => (
                <div
                  key={env.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <EnvIcon size={20} className="text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{env.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {env.variables?.length || 0} variables
                      </p>
                    </div>
                  </div>
                  {permissions.canEdit && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEnv(env);
                          setEnvName(env.name);
                          setEnvVariables(env.variables || [{ key: '', value: '', enabled: true }]);
                          setShowEnvModal(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${env.name}"?`)) {
                            try {
                              await deleteEnvironment(env.id);
                              setEnvironments(environments.filter((e) => e.id !== env.id));
                              deleteEnvInStore(env.id);
                              toast.success('Environment deleted');
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to delete environment');
                            }
                          }
                        }}
                        className="flex items-center gap-1 text-red-600 dark:text-red-400"
                      >
                        <X size={14} />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Environment Modal */}
      {showEnvModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingEnv ? 'Edit Environment' : 'New Environment'}
            </h3>
            
            <div className="space-y-4">
              <Input
                label="Environment Name"
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                placeholder="e.g., Development, Production"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables
                </label>
                <div className="space-y-2">
                  {envVariables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={variable.enabled}
                        onChange={(e) => {
                          const newVars = [...envVariables];
                          newVars[index].enabled = e.target.checked;
                          setEnvVariables(newVars);
                        }}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        placeholder="Variable name"
                        value={variable.key}
                        onChange={(e) => {
                          const newVars = [...envVariables];
                          newVars[index].key = e.target.value;
                          setEnvVariables(newVars);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Variable value"
                        value={variable.value}
                        onChange={(e) => {
                          const newVars = [...envVariables];
                          newVars[index].value = e.target.value;
                          setEnvVariables(newVars);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEnvVariables(envVariables.filter((_, i) => i !== index));
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEnvVariables([...envVariables, { key: '', value: '', enabled: true }]);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Variable
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEnvModal(false);
                    setEditingEnv(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!envName.trim()) {
                      toast.error('Environment name is required');
                      return;
                    }

                    try {
                      const filteredVars = envVariables.filter((v) => v.key.trim());
                      if (editingEnv) {
                        const updated = await updateEnvironment(editingEnv.id, {
                          name: envName,
                          variables: filteredVars,
                        });
                        setEnvironments(environments.map((e) => (e.id === editingEnv.id ? updated : e)));
                        updateEnvInStore(editingEnv.id, updated);
                        toast.success('Environment updated');
                      } else {
                        if (!id) return;
                        const newEnv = await createWorkspaceEnvironment(id, {
                          name: envName,
                          variables: filteredVars,
                        });
                        setEnvironments([...environments, newEnv]);
                        addEnvironment(newEnv);
                        toast.success('Environment created');
                      }
                      setShowEnvModal(false);
                      setEditingEnv(null);
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to save environment');
                    }
                  }}
                >
                  {editingEnv ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Info */}
      <Card title="Workspace Information">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Type:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentWorkspace.is_team ? 'Team' : 'Private'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Owner:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentWorkspace.owner?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {currentWorkspace.created_at
                ? new Date(currentWorkspace.created_at).toLocaleDateString()
                : 'Unknown'}
            </span>
          </div>
        </div>
      </Card>

      {/* Export */}
      <Card title="Export">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export workspace data including collections and settings
          </p>
          <Button
            variant="secondary"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Export Workspace
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      {permissions.canDelete && (
        <Card title="Danger Zone" className="border-red-300 dark:border-red-700">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  Delete Workspace
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone. All collections and data in this workspace will be permanently deleted.
                </p>
              </div>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Workspace
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure? Type the workspace name to confirm.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={currentWorkspace.name}
                    className="flex-1 px-3 py-2 border-2 border-red-300 dark:border-red-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowDeleteConfirm(false);
                      }
                    }}
                  />
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={loading}
                    loading={loading}
                  >
                    Confirm Delete
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
