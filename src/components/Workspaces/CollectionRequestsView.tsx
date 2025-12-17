/**
 * Collection Requests View
 * Hiển thị danh sách requests trong collection với khả năng add/edit/delete
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollectionStore, Request } from '../../stores/collectionStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/authService';
import { saveRequest } from '../../services/storageService';
import { getCollection } from '../../services/collectionService';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Badge from '../UI/Badge';
import EmptyState from '../EmptyStates/EmptyState';
import PageLayout from '../Layout/PageLayout';
import PageToolbar from '../Layout/PageToolbar';
import FolderManager from '../Folders/FolderManager';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Send,
  Search,
  Loader2,
  FileCode,
  MoreVertical,
} from 'lucide-react';

export default function CollectionRequestsView() {
  const { id: workspaceId, collectionId } = useParams<{ id: string; collectionId: string }>();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { collections, deleteRequestFromCollection, triggerReload, reloadTrigger, setCollections, updateCollection } = useCollectionStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const collection = collectionId ? collections.find((c) => c.id === collectionId) : null;
  const requests = collection?.requests || [];

  // Reload collection từ backend khi reloadTrigger thay đổi hoặc khi component mount
  useEffect(() => {
    if (!collectionId) return;

    const loadCollection = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) return;

        setLoading(true);
        const updatedCollection = await getCollection(collectionId);
        
        // Parse collection.data để lấy requests
        const collectionData = typeof updatedCollection.data === 'string' 
          ? JSON.parse(updatedCollection.data) 
          : updatedCollection.data || {};
        
        const requestsList = collectionData.requests || [];
        
        // Update collection trong store
        updateCollection(collectionId, {
          ...updatedCollection,
          requests: requestsList,
        });
      } catch (error) {
        console.error('Failed to reload collection:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [collectionId, reloadTrigger, updateCollection]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        request.name.toLowerCase().includes(query) ||
        request.url.toLowerCase().includes(query) ||
        request.method.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  const handleNewRequest = () => {
    if (!collectionId) return;
    navigate(`/workspace/${workspaceId}/collections/${collectionId}/requests/new`);
  };

  const handleEditRequest = (requestId: string) => {
    if (!collectionId) return;
    navigate(`/workspace/${workspaceId}/collections/${collectionId}/requests/${requestId}`);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!collectionId || !requestId) return;

    setIsDeleting(true);
    try {
      await deleteRequestFromCollection(collectionId, requestId);
      toast.success('Request deleted successfully');
      setShowDeleteConfirm(null);
      triggerReload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete request');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateRequest = async (request: Request) => {
    if (!collectionId) return;

    try {
      const duplicatedRequest = {
        ...request,
        id: Date.now().toString(),
        name: `${request.name} (Copy)`,
      };

      await saveRequest(
        {
          name: duplicatedRequest.name,
          method: duplicatedRequest.method,
          url: duplicatedRequest.url,
          headers: duplicatedRequest.headers || {},
          body: duplicatedRequest.body,
          queryParams: duplicatedRequest.queryParams || [],
        },
        collectionId
      );

      toast.success('Request duplicated successfully');
      triggerReload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate request');
    }
  };

  const getMethodBadgeVariant = useCallback((method: string) => {
    const upperMethod = method.toUpperCase();
    switch (upperMethod) {
      case 'GET':
        return 'success';
      case 'POST':
        return 'primary';
      case 'PUT':
      case 'PATCH':
        return 'warning';
      case 'DELETE':
        return 'error';
      default:
        return 'gray';
    }
  }, []);

  const renderToolbar = useCallback(() => {
    return (
      <PageToolbar
        leftSection={
          <>
            <FileCode size={20} className="text-gray-600 dark:text-gray-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Requests
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {collection?.name ? `${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''} in ${collection.name}` : 'Manage API requests'}
              </p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                fullWidth
              />
            </div>
          </>
        }
        rightSection={
          permissions.canEdit && (
            <Button
              variant="primary"
              onClick={handleNewRequest}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Request
            </Button>
          )
        }
      >
        {/* Toolbar content */}
      </PageToolbar>
    );
  }, [collection?.name, filteredRequests.length, searchQuery, permissions.canEdit, handleNewRequest]);

  if (!collection) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          {loading ? 'Loading collection...' : 'Collection not found'}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout toolbar={renderToolbar()}>
        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={FileCode}
            title={searchQuery ? 'No requests found' : 'No requests yet'}
            description={
              searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first request to get started'
            }
            action={
              permissions.canEdit && !searchQuery
                ? {
                    label: 'Create Request',
                    onClick: handleNewRequest,
                  }
                : undefined
            }
          />
        ) : (
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <FolderManager collectionId={collectionId || undefined} />
          </div>
        )}
      </PageLayout>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Delete Request
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this request? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteRequest(showDeleteConfirm)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
