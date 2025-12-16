/**
 * Collection Requests View
 * Hiển thị danh sách requests trong collection với khả năng add/edit/delete
 */

import { useState, useEffect } from 'react';
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

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.name.toLowerCase().includes(query) ||
      request.url.toLowerCase().includes(query) ||
      request.method.toLowerCase().includes(query)
    );
  });

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

  const getMethodBadgeVariant = (method: string) => {
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
  };

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
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
        {permissions.canEdit && (
          <Button
            variant="primary"
            onClick={handleNewRequest}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Request
          </Button>
        )}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              title={
                <div className="flex items-center gap-2">
                  <Badge variant={getMethodBadgeVariant(request.method)} size="sm">
                    {request.method}
                  </Badge>
                  <span className="font-semibold truncate">{request.name}</span>
                </div>
              }
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleEditRequest(request.id)}
            >
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 break-all">
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                    {request.url}
                  </code>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t-2 border-gray-200 dark:border-gray-700">
                  {permissions.canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRequest(request.id);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateRequest(request);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Copy size={12} />
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(request.id);
                        }}
                        className="flex items-center gap-1 text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={12} />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
