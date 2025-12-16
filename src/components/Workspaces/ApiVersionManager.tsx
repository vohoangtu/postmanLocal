/**
 * API Version Manager
 * Component quản lý versions của API schema
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApiVersionStore } from '../../stores/apiVersionStore';
import { useApiSchemaStore } from '../../stores/apiSchemaStore';
import {
  getSchemaVersions,
  createVersion,
  getVersionDiff,
  setCurrentVersion,
} from '../../services/apiVersionService';
import { useToast } from '../../hooks/useToast';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import VersionDiffViewer from './VersionDiffViewer';
import {
  Plus,
  Loader2,
  CheckCircle2,
  GitBranch,
  Eye,
  ArrowLeft,
} from 'lucide-react';

export default function ApiVersionManager() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { selectedSchema, getSchema } = useApiSchemaStore();
  const {
    versions,
    selectedVersion,
    diff,
    isLoading,
    setVersions,
    setSelectedVersion,
    setDiff,
    setLoading,
    getVersion,
  } = useApiVersionStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [viewingDiff, setViewingDiff] = useState(false);

  useEffect(() => {
    if (selectedSchema) {
      loadVersions();
    }
  }, [selectedSchema]);

  const loadVersions = async () => {
    if (!selectedSchema) return;
    setLoading(true);
    try {
      const data = await getSchemaVersions(selectedSchema);
      setVersions(data);
      if (data.length > 0 && !selectedVersion) {
        setSelectedVersion(data[0].id.toString());
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedSchema) return;

    setIsCreating(true);
    try {
      const newVersion = await createVersion(selectedSchema, {
        version_name: versionName || undefined,
        changelog: changelog || undefined,
        is_current: true,
      });
      setVersions([newVersion, ...versions]);
      setSelectedVersion(newVersion.id.toString());
      setShowCreateModal(false);
      setVersionName('');
      setChangelog('');
      toast.success('Version created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create version');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDiff = async (versionId: string) => {
    try {
      const diffData = await getVersionDiff(versionId);
      setDiff(diffData);
      setViewingDiff(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load diff');
    }
  };

  const handleSetCurrent = async (versionId: string) => {
    try {
      await setCurrentVersion(versionId);
      await loadVersions();
      toast.success('Version set as current');
    } catch (error: any) {
      toast.error(error.message || 'Failed to set current version');
    }
  };

  const currentSchema = selectedSchema ? getSchema(selectedSchema) : null;
  const selectedVersionData = selectedVersion ? getVersion(selectedVersion) : null;

  if (!currentSchema) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please select a schema first
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (viewingDiff && diff) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setViewingDiff(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Version Diff
          </h2>
        </div>
        <VersionDiffViewer
          diff={diff.diff}
          current={diff.current}
          previous={diff.previous}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            API Version Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage versions for: {currentSchema.name}
          </p>
        </div>
        {permissions.canEdit && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Version
          </Button>
        )}
      </div>

      {/* Versions List */}
      <Card title="Versions">
        {versions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No versions yet. Create your first version to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-4 border-2 rounded-lg ${
                  version.is_current
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch size={18} className="text-gray-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        v{version.version_number}
                        {version.version_name && ` - ${version.version_name}`}
                      </span>
                      {version.is_current && (
                        <Badge variant="success" size="sm">
                          Current
                        </Badge>
                      )}
                    </div>
                    {version.changelog && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {version.changelog}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created by {version.created_by?.name || 'Unknown'} on{' '}
                      {new Date(version.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDiff(version.id.toString())}
                      className="flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View Diff
                    </Button>
                    {!version.is_current && permissions.canEdit && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSetCurrent(version.id.toString())}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} />
                        Set Current
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create New Version
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version Name (optional)
                </label>
                <Input
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="e.g., Major Update"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Changelog
                </label>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="Describe changes in this version..."
                  className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setVersionName('');
                    setChangelog('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateVersion}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Version'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
