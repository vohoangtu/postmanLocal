/**
 * Collection Detail Page
 * Trang chi tiết collection với tabs cho Requests và Documentation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useCollectionStore } from '../../stores/collectionStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import TabButton from '../UI/TabButton';
import Badge from '../UI/Badge';
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  Edit2, 
  FileCode, 
  Folder,
  Loader2,
  Share2
} from 'lucide-react';

export default function CollectionDetailPage() {
  const { id: workspaceId, collectionId } = useParams<{ id: string; collectionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace } = useWorkspaceStore();
  const { collections, triggerReload, updateCollection, setCollections } = useCollectionStore();
  const toast = useToast();
  const permissions = useWorkspacePermission(currentWorkspace);
  
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loadedCollection, setLoadedCollection] = useState<any>(null);

  // Tìm collection trong store với ID đã normalize, hoặc dùng loadedCollection
  const collection = loadedCollection || (collectionId 
    ? collections.find((c) => {
        const cId = c.id?.toString();
        const targetId = collectionId.toString();
        return cId === targetId;
      })
    : null);

  useEffect(() => {
    if (collectionId && workspaceId) {
      // Luôn load collection từ API để đảm bảo có data mới nhất
      loadCollection();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, workspaceId]);

  useEffect(() => {
    if (collection) {
      setEditName(collection.name);
      setEditDescription(collection.description || '');
    }
  }, [collection]);

  const loadCollection = async () => {
    if (!collectionId || !workspaceId) return;
    
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        toast.error('Chưa đăng nhập');
        navigate(`/workspace/${workspaceId}/collections`);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded collection data:', { id: data.id, name: data.name, data: data.data });
        
        // Parse collection data - xử lý nhiều format khác nhau
        let requests: any[] = [];
        if (data.data) {
          if (typeof data.data === 'string') {
            try {
              const parsedData = JSON.parse(data.data);
              if (Array.isArray(parsedData)) {
                requests = parsedData;
              } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.requests)) {
                requests = parsedData.requests;
              }
            } catch (e) {
              console.error('Error parsing collection data (string):', e);
            }
          } else if (Array.isArray(data.data)) {
            // Nếu data là array trực tiếp
            requests = data.data;
          } else if (typeof data.data === 'object' && data.data !== null) {
            // Nếu data là object, kiểm tra requests property
            if (Array.isArray(data.data.requests)) {
              requests = data.data.requests;
            } else if (data.data.requests && typeof data.data.requests === 'string') {
              // Nếu requests là string, parse nó
              try {
                const parsed = JSON.parse(data.data.requests);
                requests = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.error('Error parsing requests string:', e);
              }
            }
          }
        }
        
        // Đảm bảo requests luôn là array
        if (!Array.isArray(requests)) {
          console.warn('Requests is not an array, converting to empty array:', requests);
          requests = [];
        }
        
        console.log('Parsed requests:', requests.length);
        
        // Đảm bảo ID là string để match với collectionId từ URL
        const normalizedId = data.id?.toString() || collectionId.toString();
        const collectionData = {
          ...data,
          id: normalizedId,
          requests,
        };
        
        // Lưu vào local state trước
        setLoadedCollection(collectionData);
        
        // Update hoặc thêm collection vào store
        const existingIndex = collections.findIndex((c) => c.id?.toString() === normalizedId);
        if (existingIndex >= 0) {
          // Update existing collection
          updateCollection(normalizedId, collectionData);
        } else {
          // Add new collection to store
          setCollections([...collections, collectionData]);
        }
        
        triggerReload();
      } else {
        toast.error('Failed to load collection');
        navigate(`/workspace/${workspaceId}/collections`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load collection');
      navigate(`/workspace/${workspaceId}/collections`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionId || !workspaceId) return;

    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Collection deleted successfully');
        navigate(`/workspace/${workspaceId}/collections`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete collection');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete collection');
    }
  };

  const handleUpdateCollection = async () => {
    if (!collectionId || !editName.trim()) return;

    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName,
            description: editDescription || undefined,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        // Parse requests từ updated data
        let requests: any[] = [];
        if (updated.data) {
          if (typeof updated.data === 'string') {
            try {
              const parsedData = JSON.parse(updated.data);
              requests = Array.isArray(parsedData) ? parsedData : (parsedData.requests || []);
            } catch (e) {
              console.error('Error parsing collection data:', e);
            }
          } else if (Array.isArray(updated.data)) {
            requests = updated.data;
          } else if (updated.data.requests) {
            requests = updated.data.requests;
          }
        }
        
        const collectionData = {
          ...updated,
          requests,
        };
        
        updateCollection(collectionId, collectionData);
        toast.success('Collection updated successfully');
        setShowEditModal(false);
        triggerReload();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update collection');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update collection');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Collection not found
        </div>
      </div>
    );
  }

  const activeTab = location.pathname.includes('/documentation') ? 'documentation' : 'requests';
  const requestCount = collection.requests?.length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/workspace/${workspaceId}/collections`)}
              className="flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Folder size={20} className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {collection.name}
                </h1>
              </div>
              {collection.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1"
                >
                  <Edit2 size={14} />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200 dark:border-gray-700">
          <TabButton
            active={activeTab === 'requests'}
            onClick={() => navigate(`/workspace/${workspaceId}/collections/${collectionId}/requests`)}
            icon={FileCode}
          >
            Requests
            {requestCount > 0 && (
              <Badge variant="gray" size="sm" className="ml-1">
                {requestCount}
              </Badge>
            )}
          </TabButton>
          <TabButton
            active={activeTab === 'documentation'}
            onClick={() => navigate(`/workspace/${workspaceId}/collections/${collectionId}/documentation`)}
            icon={FileCode}
          >
            Documentation
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Edit Collection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter collection name"
                  className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter collection description"
                  className="w-full px-3 py-2 border-2 border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditName(collection.name);
                    setEditDescription(collection.description || '');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateCollection}
                  disabled={!editName.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Delete Collection
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{collection.name}"? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  handleDeleteCollection();
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
