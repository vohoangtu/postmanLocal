/**
 * Collection Requests View
 * Hiển thị danh sách requests trong collection với khả năng add/edit/delete
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollectionStore, Request } from '../../stores/collectionStore';
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
} from 'lucide-react';

export default function CollectionRequestsView() {
  const { id: collectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, deleteRequestFromCollection, triggerReload, reloadTrigger, updateCollection } = useCollectionStore();
  const toast = useToast();

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
        let requestsList: Request[] = [];
        if (updatedCollection.data) {
          if (typeof updatedCollection.data === 'string') {
            try {
              const parsedData = JSON.parse(updatedCollection.data);
              if (Array.isArray(parsedData)) {
                requestsList = parsedData;
              } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.requests)) {
                requestsList = parsedData.requests;
              }
            } catch (e) {
              console.error('Error parsing collection data:', e);
            }
          } else if (Array.isArray(updatedCollection.data)) {
            requestsList = updatedCollection.data;
          } else if (typeof updatedCollection.data === 'object' && updatedCollection.data !== null) {
            if (Array.isArray(updatedCollection.data.requests)) {
              requestsList = updatedCollection.data.requests;
            }
          }
        }
        
        // Update collection trong store
        updateCollection(collectionId, {
          ...updatedCollection,
          requests: requestsList,
        });
      } catch (error) {
        console.error('Failed to reload collection:', error);
        toast.error('Không thể tải collection');
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [collectionId, reloadTrigger, updateCollection, toast]);

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
    navigate(`/collections/${collectionId}/requests/new`);
  };

  const handleEditRequest = (requestId: string) => {
    if (!collectionId) return;
    navigate(`/collections/${collectionId}/requests/${requestId}`);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!collectionId || !requestId) return;

    setIsDeleting(true);
    try {
      await deleteRequestFromCollection(collectionId, requestId);
      toast.success('Đã xóa request thành công');
      setShowDeleteConfirm(null);
      triggerReload();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa request');
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

      toast.success('Đã duplicate request thành công');
      triggerReload();
    } catch (error: any) {
      toast.error(error.message || 'Không thể duplicate request');
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
          {loading ? 'Đang tải collection...' : 'Collection không tồn tại'}
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
            placeholder="Tìm kiếm requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleNewRequest}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Request Mới
        </Button>
      </div>

      {/* Requests List */}
      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title={searchQuery ? 'Không tìm thấy requests' : 'Chưa có requests'}
          description={
            searchQuery
              ? 'Thử điều chỉnh từ khóa tìm kiếm'
              : 'Tạo request đầu tiên để bắt đầu'
          }
          action={
            !searchQuery
              ? {
                  label: 'Tạo Request',
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
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
                    Sửa
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
                    Copy
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
                    Xóa
                  </Button>
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
              Xóa Request
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bạn có chắc chắn muốn xóa request này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteRequest(showDeleteConfirm)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
