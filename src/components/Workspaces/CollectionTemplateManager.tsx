/**
 * Collection Template Manager
 * Quản lý và browse collection templates trong workspace
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Card from '../UI/Card';
import EmptyState from '../EmptyStates/EmptyState';
import Select from '../UI/Select';
import Input from '../UI/Input';
import { FileCode, Search, Tag, Plus, Folder } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  template_category?: string;
  template_tags?: string[];
  requests?: any[];
}

export default function CollectionTemplateManager() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { addCollection } = useCollectionStore();
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (workspaceId) {
      loadTemplates();
    }
  }, [workspaceId, search, category]);

  const loadTemplates = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/workspaces/${workspaceId}/templates?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const templatesList = Array.isArray(data) ? data : (data.data || []);
        setTemplates(templatesList);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(templatesList.map((t: Template) => t.template_category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      // Get template details
      const templateResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections/${templateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!templateResponse.ok) {
        throw new Error('Failed to load template');
      }

      const template = await templateResponse.json();

      // Create new collection from template
      const createResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${template.name} (Copy)`,
            description: template.description,
            workspace_id: workspaceId,
            data: template.data || { requests: [] },
          }),
        }
      );

      if (createResponse.ok) {
        const collection = await createResponse.json();
        addCollection({
          id: collection.id.toString(),
          name: collection.name,
          description: collection.description,
          requests: collection.data?.requests || [],
          workspace_id: collection.workspace_id?.toString(),
        });
        toast.success('Collection created from template successfully');
        loadTemplates();
      } else {
        const error = await createResponse.json();
        toast.error(error.message || 'Failed to create collection from template');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create collection from template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Collection Templates
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and create collections from templates
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
        {categories.length > 0 && (
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
            className="w-48"
          />
        )}
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title="No templates found"
          description="No collection templates available in this workspace"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              title={
                <div className="flex items-center gap-2">
                  <FileCode size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold">{template.name}</span>
                </div>
              }
              subtitle={template.description}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="space-y-3">
                {template.template_category && (
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {template.template_category}
                    </span>
                  </div>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {template.requests?.length || 0} requests
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCreateFromTemplate(template.id)}
                  className="w-full flex items-center gap-2"
                  disabled={loading}
                >
                  <Plus size={14} />
                  Create from Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
