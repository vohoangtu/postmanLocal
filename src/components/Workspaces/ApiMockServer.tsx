/**
 * API Mock Server
 * Component quản lý mock servers
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMockServerStore } from '../../stores/mockServerStore';
import { useApiSchemaStore } from '../../stores/apiSchemaStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import {
  getWorkspaceMockServers,
  createMockServer,
  updateMockServer,
  deleteMockServer,
  startMockServer,
  stopMockServer,
  getMockServerRoutes,
} from '../../services/mockServerService';
import { useToast } from '../../hooks/useToast';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import {
  Plus,
  Trash2,
  Play,
  Square,
  Loader2,
  Server,
  ExternalLink,
} from 'lucide-react';

export default function ApiMockServer() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { schemas } = useApiSchemaStore();
  const {
    mockServers,
    selectedServer,
    routes,
    isLoading,
    setMockServers,
    setSelectedServer,
    updateMockServer: updateMockServerStore,
    deleteMockServer: deleteMockServerStore,
    setRoutes,
    setLoading,
    getMockServer,
  } = useMockServerStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serverName, setServerName] = useState('');
  const [selectedSchemaId, setSelectedSchemaId] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost');
  const [port, setPort] = useState(3000);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadMockServers();
    }
  }, [workspaceId]);

  const loadMockServers = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await getWorkspaceMockServers(workspaceId);
      setMockServers(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load mock servers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async () => {
    if (!serverName.trim() || !workspaceId) return;

    setIsCreating(true);
    try {
      const newServer = await createMockServer(workspaceId, {
        name: serverName,
        schema_id: selectedSchemaId || undefined,
        base_url: baseUrl,
        port: port,
      });
      setMockServers([...mockServers, newServer]);
      setShowCreateModal(false);
      setServerName('');
      setSelectedSchemaId('');
      setBaseUrl('http://localhost');
      setPort(3000);
      toast.success('Mock server created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create mock server');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartServer = async (serverId: string) => {
    try {
      const updated = await startMockServer(serverId);
      updateMockServerStore(serverId, updated);
      toast.success('Mock server started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start mock server');
    }
  };

  const handleStopServer = async (serverId: string) => {
    try {
      const updated = await stopMockServer(serverId);
      updateMockServerStore(serverId, updated);
      toast.success('Mock server stopped');
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop mock server');
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this mock server?')) return;

    try {
      await deleteMockServer(serverId);
      deleteMockServerStore(serverId);
      toast.success('Mock server deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete mock server');
    }
  };

  const handleLoadRoutes = async (serverId: string) => {
    setLoadingRoutes(serverId);
    try {
      const serverRoutes = await getMockServerRoutes(serverId);
      setRoutes(serverId, serverRoutes);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load routes');
    } finally {
      setLoadingRoutes(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  const workspaceSchemas = schemas.filter(
    (s) => s.workspace_id?.toString() === workspaceId
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Mock Servers</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and manage mock servers from your API schemas
          </p>
        </div>
        {permissions.canEdit && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Mock Server
          </Button>
        )}
      </div>

      {/* Mock Servers List */}
      {mockServers.length === 0 ? (
        <Card>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No mock servers yet. Create your first mock server to get started.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockServers.map((server) => {
            const serverRoutes = routes[server.id] || [];
            return (
              <Card
                key={server.id}
                title={
                  <div className="flex items-center gap-2">
                    <Server size={18} />
                    <span>{server.name}</span>
                    {server.is_active && (
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    )}
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>URL:</strong>{' '}
                      <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                        {server.base_url}:{server.port}
                      </code>
                    </div>
                    {server.schema && (
                      <div className="mt-1">
                        <strong>Schema:</strong> {server.schema.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {server.is_active ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStopServer(server.id)}
                        className="flex items-center gap-1"
                      >
                        <Square size={14} />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartServer(server.id)}
                        className="flex items-center gap-1"
                      >
                        <Play size={14} />
                        Start
                      </Button>
                    )}
                    {server.schema_id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoadRoutes(server.id)}
                        disabled={loadingRoutes === server.id}
                        className="flex items-center gap-1"
                      >
                        {loadingRoutes === server.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ExternalLink size={14} />
                        )}
                        Load Routes
                      </Button>
                    )}
                    {permissions.canEdit && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteServer(server.id)}
                        className="flex items-center gap-1 ml-auto"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>

                  {serverRoutes.length > 0 && (
                    <div className="mt-3 pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Routes ({serverRoutes.length})
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {serverRoutes.map((route, index) => (
                          <div
                            key={index}
                            className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded"
                          >
                            <span
                              className={`px-1 py-0.5 rounded text-xs font-mono ${
                                route.method === 'GET'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800'
                                  : route.method === 'POST'
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800'
                              }`}
                            >
                              {route.method}
                            </span>{' '}
                            <code className="text-gray-600 dark:text-gray-400">
                              {route.path}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Mock Server
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Server Name
                </label>
                <Input
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="My Mock Server"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schema (optional)
                </label>
                <Select
                  value={selectedSchemaId}
                  onChange={(e) => setSelectedSchemaId(e.target.value)}
                  options={[
                    { value: '', label: 'No schema' },
                    ...workspaceSchemas.map((s) => ({
                      value: s.id.toString(),
                      label: s.name,
                    })),
                  ]}
                  fullWidth
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base URL
                  </label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Port
                  </label>
                  <Input
                    type="number"
                    value={port.toString()}
                    onChange={(e) => setPort(parseInt(e.target.value) || 3000)}
                    placeholder="3000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setServerName('');
                    setSelectedSchemaId('');
                    setBaseUrl('http://localhost');
                    setPort(3000);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateServer}
                  disabled={!serverName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
