/**
 * Schema Path Editor
 * Editor cho API paths trong OpenAPI schema
 */

import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';

interface PathOperation {
  method: string;
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    description?: string;
    schema?: any;
  }>;
  requestBody?: any;
  responses?: {
    [statusCode: string]: any;
  };
}

interface PathEditorProps {
  path: string;
  operations: { [method: string]: PathOperation };
  onUpdate: (path: string, operations: { [method: string]: PathOperation }) => void;
  onDelete: (path: string) => void;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

export default function SchemaPathEditor({ path, operations, onUpdate, onDelete }: PathEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPath, setEditedPath] = useState(path);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleSavePath = () => {
    if (editedPath !== path) {
      // Path đã thay đổi, cần update
      const newOperations = { ...operations };
      onUpdate(editedPath, newOperations);
    }
    setIsEditing(false);
  };

  const handleAddOperation = (method: string) => {
    const newOperations = {
      ...operations,
      [method]: {
        method,
        summary: '',
        description: '',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
      },
    };
    onUpdate(path, newOperations);
    setSelectedMethod(method);
  };

  const handleUpdateOperation = (method: string, updates: Partial<PathOperation>) => {
    const newOperations = {
      ...operations,
      [method]: {
        ...operations[method],
        ...updates,
      },
    };
    onUpdate(path, newOperations);
  };

  const handleDeleteOperation = (method: string) => {
    const newOperations = { ...operations };
    delete newOperations[method];
    onUpdate(path, newOperations);
  };

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {isEditing ? (
            <>
              <Input
                value={editedPath}
                onChange={(e) => setEditedPath(e.target.value)}
                className="flex-1"
                placeholder="/api/v1/users"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePath}
                className="flex items-center gap-1"
              >
                <Save size={14} />
                Save
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditedPath(path);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1"
              >
                <X size={14} />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {path}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1"
              >
                <Edit2 size={14} />
                Edit Path
              </Button>
            </>
          )}
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(path)}
          className="flex items-center gap-1"
        >
          <Trash2 size={14} />
          Delete Path
        </Button>
      </div>

      <div className="space-y-3">
        {Object.entries(operations).map(([method, operation]) => (
          <div
            key={method}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  method === 'get' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                  method === 'post' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                  method === 'put' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                  method === 'delete' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {method.toUpperCase()}
                </span>
                <Input
                  value={operation.summary || ''}
                  onChange={(e) => handleUpdateOperation(method, { summary: e.target.value })}
                  placeholder="Operation summary"
                  className="flex-1"
                />
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteOperation(method)}
                className="flex items-center gap-1"
              >
                <Trash2 size={12} />
              </Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  value={operation.description || ''}
                  onChange={(e) => handleUpdateOperation(method, { description: e.target.value })}
                  placeholder="Operation description"
                  className="w-full px-2 py-1 border-2 border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="text-xs">
                {operation.parameters?.length || 0} parameters,{' '}
                {Object.keys(operation.responses || {}).length} responses
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2 flex-wrap">
          {HTTP_METHODS.filter((m) => !operations[m]).map((method) => (
            <Button
              key={method}
              variant="secondary"
              size="sm"
              onClick={() => handleAddOperation(method)}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              Add {method.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
