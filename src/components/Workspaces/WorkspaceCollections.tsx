/**
 * Workspace Collections Component
 * Hiển thị và quản lý collections trong workspace
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
import Input from '../UI/Input';
import Select from '../UI/Select';
import { Folder, Plus, FolderOpen, Loader2, Settings, FileCode, Upload, Download, Search, Filter, Trash2, CheckSquare } from 'lucide-react';
import SkeletonLoader from '../UI/SkeletonLoader';
import ErrorMessage from '../Error/ErrorMessage';
import ErrorRetry from '../Error/ErrorRetry';
import { useNavigate } from 'react-router-dom';
import LiveCollaborators from './LiveCollaborators';
import CollectionPermissionsModal from './CollectionPermissionsModal';
import CollectionTemplateManager from './CollectionTemplateManager';
import CollectionImportExport from './CollectionImportExport';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import TabButton from '../UI/TabButton';

export default function WorkspaceCollections() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { collections, setCollections } = useCollectionStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'collections' | 'templates' | 'import-export'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPermission, setFilterPermission] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  useEffect(() => {
    loadCollections();
  }, [id]);

  const loadCollections = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections?workspace_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const collectionsList = Array.isArray(data) ? data : (data.data || []);
        setCollections(collectionsList);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCollections.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedCollections.length} collection(s)?`)) {
      return;
    }

    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      // Delete each collection
      for (const collectionId of selectedCollections) {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          toast.error(`Failed to delete collection: ${error.message || 'Unknown error'}`);
        }
      }

      toast.success(`${selectedCollections.length} collection(s) deleted successfully`);
      setSelectedCollections([]);
      loadCollections();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete collections');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !id) return;

    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCollectionName,
            workspace_id: id,
            data: { requests: [] },
          }),
        }
      );

      if (response.ok) {
        toast.success('Collection created successfully');
        setShowCreateModal(false);
        setNewCollectionName('');
        loadCollections();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create collection');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create collection');
    }
  };

  const workspaceCollections = collections
    .filter((c) => c.workspace_id?.toString() === id)
    .filter((c) => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !c.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filter by permission if needed
      return true;
    });

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader type="card-grid" count={6} />
      </div>
    );
  }

  if (error && collections.length === 0) {
    return (
      <div className="p-6">
        <ErrorMessage
          error={error}
          variant="banner"
          onRetry={loadCollections}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Collections
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {activeTab === 'collections' 
              ? `${workspaceCollections.length} collection${workspaceCollections.length !== 1 ? 's' : ''}`
              : 'Browse and create from templates'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'collections' && selectedCollections.length > 0 && (
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete ({selectedCollections.length})
            </Button>
          )}
          {activeTab === 'collections' && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Collection
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'collections' && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filterPermission}
            onChange={(e) => setFilterPermission(e.target.value)}
            options={[
              { value: '', label: 'All Permissions' },
              { value: 'read', label: 'Read Only' },
              { value: 'write', label: 'Write' },
              { value: 'admin', label: 'Admin' },
            ]}
            className="w-48"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-300 dark:border-gray-700">
        <TabButton
          active={activeTab === 'collections'}
          onClick={() => setActiveTab('collections')}
          icon={FolderOpen}
        >
          Collections
        </TabButton>
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          icon={FileCode}
        >
          Templates
        </TabButton>
        <TabButton
          active={activeTab === 'import-export'}
          onClick={() => setActiveTab('import-export')}
          icon={Upload}
        >
          Import/Export
        </TabButton>
      </div>

      {activeTab === 'templates' ? (
        <CollectionTemplateManager />
      ) : activeTab === 'import-export' ? (
        <CollectionImportExport />
      ) : workspaceCollections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="Create your first collection to organize your API requests"
          action={{
            label: 'Create Collection',
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaceCollections.map((collection) => (
            <div
              key={collection.id}
              className={`cursor-pointer ${
                selectedCollections.includes(collection.id.toString())
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400 rounded-lg'
                  : ''
              }`}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                // Navigate to collection detail page
                if (!id || !collection.id) {
                  console.error('Missing workspace ID or collection ID', { id, collectionId: collection.id });
                  return;
                }
                const path = `/workspace/${id}/collections/${collection.id.toString()}/requests`;
                console.log('Navigating to:', path);
                navigate(path);
              }}
            >
              <Card
                title={collection.name || 'Unnamed Collection'}
                subtitle={collection.description || undefined}
                className="hover:shadow-lg transition-shadow"
              >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(collection.id.toString())}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    e.stopPropagation();
                    if (e.target.checked) {
                      setSelectedCollections([...selectedCollections, collection.id.toString()]);
                    } else {
                      setSelectedCollections(selectedCollections.filter((id) => id !== collection.id.toString()));
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <Folder size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {collection.requests?.length || 0} requests
                </div>
                <LiveCollaborators
                  entityType="collection"
                  entityId={collection.id.toString()}
                  entityName={collection.name}
                />
                {permissions.canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCollection({ id: collection.id.toString(), name: collection.name });
                      setShowPermissionsModal(true);
                    }}
                    className="w-full mt-2 flex items-center gap-2"
                  >
                    <Settings size={14} />
                    Permissions
                  </Button>
                )}
              </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create New Collection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCollection();
                    } else if (e.key === 'Escape') {
                      setShowCreateModal(false);
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCollectionName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedCollection && (
        <CollectionPermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedCollection(null);
          }}
          collectionId={selectedCollection.id}
          collectionName={selectedCollection.name}
        />
      )}
    </div>
  );
}
