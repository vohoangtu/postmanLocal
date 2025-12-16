/**
 * API Test Suite
 * Component quản lý test suites
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApiTestStore } from '../../stores/apiTestStore';
import { useApiSchemaStore } from '../../stores/apiSchemaStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import {
  getWorkspaceTestSuites,
  createTestSuite,
  runTestSuite,
  runContractTest,
} from '../../services/apiTestService';
import { useToast } from '../../hooks/useToast';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { Plus, Play, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function ApiTestSuite() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { schemas } = useApiSchemaStore();
  const {
    testSuites,
    isLoading,
    setTestSuites,
    addTestSuite,
    updateTestSuite,
    setLoading,
  } = useApiTestStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suiteName, setSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSchemaId, setSelectedSchemaId] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [isCreating, setIsCreating] = useState(false);
  const [runningSuite, setRunningSuite] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      loadTestSuites();
    }
  }, [workspaceId]);

  const loadTestSuites = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await getWorkspaceTestSuites(workspaceId);
      setTestSuites(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load test suites');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuite = async () => {
    if (!suiteName.trim() || !workspaceId) return;

    setIsCreating(true);
    try {
      const newSuite = await createTestSuite(workspaceId, {
        name: suiteName,
        description: description || undefined,
        schema_id: selectedSchemaId || undefined,
        test_config: { base_url: baseUrl },
      });
      addTestSuite(newSuite);
      setShowCreateModal(false);
      setSuiteName('');
      setDescription('');
      setSelectedSchemaId('');
      setBaseUrl('http://localhost:3000');
      toast.success('Test suite created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create test suite');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunSuite = async (suiteId: string) => {
    setRunningSuite(suiteId);
    try {
      const updated = await runTestSuite(suiteId);
      updateTestSuite(suiteId, updated);
      toast.success('Test suite completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to run test suite');
    } finally {
      setRunningSuite(null);
    }
  };

  const handleContractTest = async (suiteId: string, baseUrl: string) => {
    setRunningSuite(suiteId);
    try {
      const updated = await runContractTest(suiteId, baseUrl);
      updateTestSuite(suiteId, updated);
      toast.success('Contract test completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to run contract test');
    } finally {
      setRunningSuite(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="success">Passed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'running':
        return <Badge variant="info">Running</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="gray">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Test Suites</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create and run test suites for your APIs
          </p>
        </div>
        {permissions.canEdit && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Test Suite
          </Button>
        )}
      </div>

      {testSuites.length === 0 ? (
        <Card>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No test suites yet. Create your first test suite to get started.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {testSuites.map((suite) => (
            <Card
              key={suite.id}
              title={
                <div className="flex items-center gap-2">
                  <span>{suite.name}</span>
                  {getStatusBadge(suite.status)}
                </div>
              }
            >
              <div className="space-y-3">
                {suite.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{suite.description}</p>
                )}
                {suite.schema && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Schema:</strong> {suite.schema.name}
                  </div>
                )}
                {suite.results?.summary && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 size={14} />
                      {suite.results.summary.passed} passed
                    </div>
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <XCircle size={14} />
                      {suite.results.summary.failed} failed
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {suite.results.summary.total} total
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRunSuite(suite.id.toString())}
                    disabled={runningSuite === suite.id.toString()}
                    className="flex items-center gap-1"
                  >
                    {runningSuite === suite.id.toString() ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    Run Tests
                  </Button>
                  {suite.test_config.base_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        handleContractTest(suite.id.toString(), suite.test_config.base_url!)
                      }
                      disabled={runningSuite === suite.id.toString()}
                      className="flex items-center gap-1"
                    >
                      Contract Test
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Test Suite
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Suite Name
                </label>
                <Input
                  value={suiteName}
                  onChange={(e) => setSuiteName(e.target.value)}
                  placeholder="My Test Suite"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Test suite description"
                  className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSuiteName('');
                    setDescription('');
                    setSelectedSchemaId('');
                    setBaseUrl('http://localhost:3000');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateSuite}
                  disabled={!suiteName.trim() || isCreating}
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
