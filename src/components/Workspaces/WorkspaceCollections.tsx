/**
 * Workspace Collections Component
 * Hiển thị và quản lý collections trong workspace
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCollectionStore } from '../../stores/collectionStore';
import { 
  getCollections, 
  createCollection, 
  deleteCollection 
} from '../../services/collectionService';
import { useToast } from '../../hooks/useToast';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import Button from '../UI/Button';
import EmptyState from '../EmptyStates/EmptyState';
import Input from '../UI/Input';
import Select from '../UI/Select';
import PageLayout from '../Layout/PageLayout';
import PageToolbar from '../Layout/PageToolbar';
import CollectionCard from '../Collections/CollectionCard';
import { Folder, Plus, FolderOpen, Settings, FileCode, Upload, Search, Trash2 } from 'lucide-react';
import SkeletonLoader from '../UI/SkeletonLoader';
import ErrorMessage from '../Error/ErrorMessage';
import { useNavigate } from 'react-router-dom';
import CollectionPermissionsModal from './CollectionPermissionsModal';
import CollectionTemplateManager from './CollectionTemplateManager';
import CollectionImportExport from './CollectionImportExport';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import TabButton from '../UI/TabButton';
import type { Collection, CreateCollectionFormData } from '../../types/workspace';

export default function WorkspaceCollections() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspace, loading: workspaceLoading, error: workspaceError } = useWorkspaceData(workspaceId);
  const { collections, setCollections } = useCollectionStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'collections' | 'templates' | 'import-export'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPermission, setFilterPermission] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const toast = useToast();
  const permissions = useWorkspacePermission(workspace);

  // Load collections operation
  const {
    loading: collectionsLoading,
    error: collectionsError,
    execute: loadCollections,
  } = useAsyncOperation<Collection[]>(
    async () => {
      if (!workspaceId) throw new Error('Workspace ID không hợp lệ');
      const allCollections = await getCollections();
      // Filter collections by workspace (nếu có workspace_id trong collection)
      // Hoặc lấy tất cả collections nếu không có workspace_id field
      const data = allCollections.filter((c: any) => 
        !c.workspace_id || c.workspace_id?.toString() === workspaceId
      );
      setCollections(data);
      return data;
    },
    {
      onError: (error) => {
        console.error('Failed to load collections:', error);
      },
    }
  );

  useEffect(() => {
    if (workspaceId) {
      loadCollections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const loading = workspaceLoading || collectionsLoading;
  const error = workspaceError || collectionsError;

  // Bulk delete operation
  const {
    loading: deleting,
    execute: executeBulkDelete,
  } = useAsyncOperation(
    async () => {
      if (selectedCollections.length === 0) return;
      
      if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedCollections.length} collection(s)?`)) {
        return;
      }

      // Delete each collection
      for (const collectionId of selectedCollections) {
        try {
          await deleteCollection(collectionId);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Không thể xóa collection: ${errorMessage}`);
        }
      }

      toast.success(`Đã xóa thành công ${selectedCollections.length} collection(s)`);
      setSelectedCollections([]);
      await loadCollections();
    },
    {
      onError: (error) => {
        toast.error(error.message || 'Không thể xóa collections');
      },
    }
  );

  // Create collection operation
  const {
    loading: creating,
    execute: executeCreateCollection,
  } = useAsyncOperation<Collection>(
    async () => {
      if (!newCollectionName.trim() || !workspaceId) {
        throw new Error('Tên collection và workspace ID là bắt buộc');
      }

      const formData: CreateCollectionFormData = {
        name: newCollectionName.trim(),
      };

      const newCollection = await createCollection(formData);
      toast.success('Đã tạo collection thành công');
      setShowCreateModal(false);
      setNewCollectionName('');
      await loadCollections();
      return newCollection;
    },
    {
      onError: (error) => {
        toast.error(error.message || 'Không thể tạo collection');
      },
    }
  );

  const handleCreateCollection = () => {
    executeCreateCollection();
  };

  const workspaceCollections = useMemo(() => {
    return collections
      .filter((c: any) => {
        // Filter by workspace if workspace_id exists, otherwise show all
        if (c.workspace_id) {
          return c.workspace_id.toString() === workspaceId;
        }
        // Nếu không có workspace_id, hiển thị tất cả collections
        return true;
      })
      .filter((c) => {
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !c.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        // Filter by permission if needed
        return true;
      });
  }, [collections, workspaceId, searchQuery]);

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader type="card-grid" count={6} />
      </div>
    );
  }

  if (error && collections.length === 0 && !loading) {
    return (
      <div className="p-6">
        <ErrorMessage
          error={error}
          variant="banner"
          onRetry={() => loadCollections()}
        />
      </div>
    );
  }

  const handleCollectionClick = useCallback((collectionId: string) => {
    if (!workspaceId || !collectionId) {
      console.error('Missing workspace ID or collection ID', { workspaceId, collectionId });
      return;
    }
    const path = `/workspace/${workspaceId}/collections/${collectionId}/requests`;
    navigate(path);
  }, [workspaceId, navigate]);

  const handleCollectionSelect = useCallback((collectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedCollections([...selectedCollections, collectionId]);
    } else {
      setSelectedCollections(selectedCollections.filter((id) => id !== collectionId));
    }
  }, [selectedCollections]);

  const renderToolbar = useCallback(() => {
    return (
      <div className="space-y-4">
        <PageToolbar
          leftSection={
            <>
              <Folder size={20} className="text-gray-600 dark:text-gray-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Collections
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activeTab === 'collections' 
                    ? `${workspaceCollections.length} collection${workspaceCollections.length !== 1 ? 's' : ''}`
                    : 'Browse and create from templates'}
                </p>
              </div>
              {activeTab === 'collections' && (
                <>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search collections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      fullWidth
                    />
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
                </>
              )}
            </>
          }
          rightSection={
            activeTab === 'collections' && (
              <>
                {selectedCollections.length > 0 && (
                  <Button
                    variant="danger"
                    onClick={executeBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    {deleting ? 'Đang xóa...' : `Xóa (${selectedCollections.length})`}
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Collection
                </Button>
              </>
            )
          }
        />
        {/* Tabs */}
        <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
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
      </div>
    );
  }, [activeTab, workspaceCollections.length, searchQuery, filterPermission, selectedCollections.length, deleting, executeBulkDelete]);

  return (
    <>
      <PageLayout toolbar={renderToolbar()}>

      {activeTab === 'templates' ? (
        <CollectionTemplateManager />
      ) : activeTab === 'import-export' ? (
        <CollectionImportExport onImportSuccess={() => loadCollections()} />
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
              className="relative"
            >
              <input
                type="checkbox"
                checked={selectedCollections.includes(collection.id.toString())}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleCollectionSelect(collection.id.toString(), e.target.checked);
                }}
                className="absolute top-4 left-4 z-10 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <CollectionCard
                id={collection.id.toString()}
                name={collection.name || 'Unnamed Collection'}
                description={collection.description}
                requestCount={collection.requests?.length || 0}
                isSelected={selectedCollections.includes(collection.id.toString())}
                onClick={() => handleCollectionClick(collection.id.toString())}
                className={selectedCollections.includes(collection.id.toString()) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
              />
              {permissions.canEdit && (
                <div className="absolute bottom-4 right-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCollection({ id: collection.id.toString(), name: collection.name });
                      setShowPermissionsModal(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Settings size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </PageLayout>

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
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
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
                  disabled={!newCollectionName.trim() || creating}
                >
                  {creating ? 'Đang tạo...' : 'Tạo'}
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
    </>
  );
}
