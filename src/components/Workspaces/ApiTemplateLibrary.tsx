/**
 * API Template Library
 * Thư viện templates cho API design
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useApiSchemaStore } from '../../stores/apiSchemaStore';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { FileCode, Plus, Eye } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ApiTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  template_data: any;
  is_public: boolean;
}

export default function ApiTemplateLibrary() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { setSchemas, schemas } = useApiSchemaStore();
  const toast = useToast();

  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/api-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!workspaceId) return;

    const templateName = prompt('Enter schema name:');
    if (!templateName) return;

    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspaceId}/schemas/from-template`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            name: templateName,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Failed to create schema');
      }

      const newSchema = await response.json();
      setSchemas([...schemas, newSchema]);
      toast.success('Schema created from template successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create schema from template');
    }
  };

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Templates</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose a template to start designing your API
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No templates found
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              title={
                <div className="flex items-center gap-2">
                  <FileCode size={18} />
                  <span>{template.name}</span>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">
                    {template.category}
                  </Badge>
                  {template.is_public && (
                    <Badge variant="success" size="sm">
                      Public
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCreateFromTemplate(template.id)}
                    className="flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Use Template
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPreview(template.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye size={14} />
                    Preview
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Template Preview
              </h3>
              <Button variant="secondary" size="sm" onClick={() => setShowPreview(null)}>
                Close
              </Button>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                templates.find((t) => t.id === showPreview)?.template_data,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
