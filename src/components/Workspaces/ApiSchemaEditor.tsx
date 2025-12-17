/**
 * API Schema Editor
 * Component chính cho visual editor để thiết kế và chỉnh sửa API schemas (OpenAPI 3.0)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiSchemaStore, OpenAPISchema } from '../../stores/apiSchemaStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCollectionStore } from '../../stores/collectionStore';
import {
  getWorkspaceSchemas,
  createWorkspaceSchema,
  updateSchema,
  deleteSchema,
  validateSchema,
  importSchemaFromCollection,
} from '../../services/apiSchemaService';
import { useToast } from '../../hooks/useToast';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Card from '../UI/Card';
import SchemaPathEditor from './SchemaPathEditor';
import SchemaComponentEditor from './SchemaComponentEditor';
import SchemaValidationPanel from './SchemaValidationPanel';
import {
  Save,
  Plus,
  Trash2,
  Loader2,
  FileCode,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ApiSchemaEditor() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { collections } = useCollectionStore();
  const {
    schemas,
    selectedSchema,
    validationErrors,
    isLoading,
    setSchemas,
    setSelectedSchema,
    updateSchema: updateSchemaStore,
    setValidationErrors,
    setLoading,
    getSchema,
  } = useApiSchemaStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  const [schemaName, setSchemaName] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('1.0.0');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadSchemas();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (selectedSchema) {
      const schema = getSchema(selectedSchema);
      if (schema) {
        setSchemaName(schema.name);
        setSchemaVersion(schema.schema_data.info?.version || '1.0.0');
        setSchemaDescription(schema.schema_data.info?.description || '');
      }
    }
  }, [selectedSchema, getSchema]);

  const loadSchemas = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const data = await getWorkspaceSchemas(workspaceId);
      setSchemas(data);
      if (data.length > 0 && !selectedSchema) {
        setSelectedSchema(data[0].id.toString());
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load schemas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchema = async () => {
    if (!schemaName.trim() || !workspaceId) return;

    setIsSaving(true);
    try {
      const newSchema: OpenAPISchema = {
        openapi: '3.0.0',
        info: {
          title: schemaName,
          version: schemaVersion,
          description: schemaDescription,
        },
        paths: {},
        components: {},
      };

      const created = await createWorkspaceSchema(workspaceId, schemaName, newSchema);
      updateSchemaStore(created.id.toString(), created);
      setSelectedSchema(created.id.toString());
      setShowCreateModal(false);
      setSchemaName('');
      setSchemaVersion('1.0.0');
      setSchemaDescription('');
      toast.success('Schema created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create schema');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSchema = async () => {
    if (!selectedSchema || !workspaceId) return;

    const schema = getSchema(selectedSchema);
    if (!schema) return;

    setIsSaving(true);
    try {
      const updatedSchemaData: OpenAPISchema = {
        ...schema.schema_data,
        info: {
          ...schema.schema_data.info,
          title: schemaName,
          version: schemaVersion,
          description: schemaDescription,
        },
      };

      const updated = await updateSchema(selectedSchema, {
        name: schemaName,
        schema_data: updatedSchemaData,
      });

      updateSchemaStore(selectedSchema, updated);
      toast.success('Schema saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save schema');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchema = async () => {
    if (!selectedSchema) return;
    if (!confirm('Are you sure you want to delete this schema?')) return;

    try {
      await deleteSchema(selectedSchema);
      const newSchemas = schemas.filter((s) => s.id.toString() !== selectedSchema);
      setSchemas(newSchemas);
      setSelectedSchema(newSchemas.length > 0 ? newSchemas[0].id.toString() : null);
      toast.success('Schema deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete schema');
    }
  };

  const handleValidateSchema = async () => {
    if (!selectedSchema) return;

    setIsValidating(true);
    try {
      const schema = getSchema(selectedSchema);
      if (!schema) return;

      const result = await validateSchema(selectedSchema, schema.schema_data);
      setValidationErrors(result.errors);
      if (result.valid) {
        toast.success('Schema is valid');
      } else {
        toast.error(`Schema has ${result.errors.length} validation issue(s)`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to validate schema');
    } finally {
      setIsValidating(false);
    }
  };

  const handleImportFromCollection = async () => {
    if (!selectedSchema || !selectedCollectionId) return;

    try {
      const updated = await importSchemaFromCollection(selectedSchema, selectedCollectionId);
      updateSchemaStore(selectedSchema, updated);
      setShowImportModal(false);
      setSelectedCollectionId('');
      toast.success('Schema imported from collection successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to import schema');
    }
  };

  const handleUpdatePaths = (paths: OpenAPISchema['paths']) => {
    if (!selectedSchema) return;
    const schema = getSchema(selectedSchema);
    if (!schema) return;

    const updatedSchemaData: OpenAPISchema = {
      ...schema.schema_data,
      paths,
    };

    updateSchemaStore(selectedSchema, {
      ...schema,
      schema_data: updatedSchemaData,
    });
  };

  const handleUpdateComponents = (components: OpenAPISchema['components']) => {
    if (!selectedSchema) return;
    const schema = getSchema(selectedSchema);
    if (!schema) return;

    const updatedSchemaData: OpenAPISchema = {
      ...schema.schema_data,
      components,
    };

    updateSchemaStore(selectedSchema, {
      ...schema,
      schema_data: updatedSchemaData,
    });
  };

  const currentSchema = selectedSchema ? getSchema(selectedSchema) : null;

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Schema Editor</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Design and edit OpenAPI 3.0 schemas for your API
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permissions.canEdit && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2"
                disabled={!selectedSchema}
              >
                <Upload size={16} />
                Import from Collection
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                New Schema
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Schema Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={selectedSchema || ''}
            onChange={(e) => setSelectedSchema(e.target.value || null)}
            options={[
              { value: '', label: 'Select a schema...' },
              ...schemas.map((s) => ({
                value: s.id.toString(),
                label: s.name,
              })),
            ]}
            fullWidth
          />
        </div>
        {selectedSchema && permissions.canEdit && (
          <>
            <Button
              variant="secondary"
              onClick={handleValidateSchema}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Validate
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSchema}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSchema}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </>
        )}
      </div>

      {currentSchema && (
        <>
          {/* Schema Info */}
          <Card title="Schema Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schema Name
                </label>
                <Input
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  placeholder="My API"
                  disabled={!permissions.canEdit}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Version
                  </label>
                  <Input
                    value={schemaVersion}
                    onChange={(e) => setSchemaVersion(e.target.value)}
                    placeholder="1.0.0"
                    disabled={!permissions.canEdit}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={schemaDescription}
                  onChange={(e) => setSchemaDescription(e.target.value)}
                  placeholder="API description"
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  rows={3}
                  disabled={!permissions.canEdit}
                />
              </div>
            </div>
          </Card>

          {/* Validation Panel */}
          <SchemaValidationPanel errors={validationErrors} />

          {/* Paths Editor */}
          <Card title="API Paths">
            <div className="space-y-4">
              {Object.entries(currentSchema.schema_data.paths || {}).map(([path, operations]) => (
                <SchemaPathEditor
                  key={path}
                  path={path}
                  operations={operations as any}
                  onUpdate={(newPath, newOperations) => {
                    const newPaths = { ...currentSchema.schema_data.paths };
                    if (newPath !== path) {
                      delete newPaths[path];
                    }
                    newPaths[newPath] = newOperations;
                    handleUpdatePaths(newPaths);
                  }}
                  onDelete={(pathToDelete) => {
                    const newPaths = { ...currentSchema.schema_data.paths };
                    delete newPaths[pathToDelete];
                    handleUpdatePaths(newPaths);
                  }}
                />
              ))}
              {permissions.canEdit && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const newPath = prompt('Enter path (e.g., /api/v1/users):');
                    if (newPath) {
                      const newPaths = {
                        ...currentSchema.schema_data.paths,
                        [newPath]: {},
                      };
                      handleUpdatePaths(newPaths);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Path
                </Button>
              )}
            </div>
          </Card>

          {/* Components Editor */}
          {permissions.canEdit && (
            <SchemaComponentEditor
              components={currentSchema.schema_data.components || {}}
              onUpdate={handleUpdateComponents}
            />
          )}
        </>
      )}

      {/* Create Schema Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create New Schema
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schema Name
                </label>
                <Input
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  placeholder="My API"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version
                </label>
                <Input
                  value={schemaVersion}
                  onChange={(e) => setSchemaVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={schemaDescription}
                  onChange={(e) => setSchemaDescription(e.target.value)}
                  placeholder="API description"
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSchemaName('');
                    setSchemaVersion('1.0.0');
                    setSchemaDescription('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateSchema}
                  disabled={!schemaName.trim() || isSaving}
                >
                  {isSaving ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import from Collection Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Import from Collection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Collection
                </label>
                <Select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a collection...' },
                    ...collections
                      .filter((c) => c.workspace_id?.toString() === workspaceId)
                      .map((c) => ({
                        value: c.id.toString(),
                        label: c.name,
                      })),
                  ]}
                  fullWidth
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedCollectionId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportFromCollection}
                  disabled={!selectedCollectionId}
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
