/**
 * Collection Detail Page
 * Trang chi tiết collection với tabs cho Requests và các tính năng collaboration
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useCollectionStore } from '../../stores/collectionStore';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import { getCollection } from '../../services/collectionService';
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
  Share2,
  Users,
  CheckSquare,
  MessageSquare,
  FileCheck,
  Activity
} from 'lucide-react';

export default function CollectionDetailPage() {
  const { id: collectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { collections, triggerReload, updateCollection, setCollections } = useCollectionStore();
  const toast = useToast();
  
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
    if (collectionId) {
      // Luôn load collection từ API để đảm bảo có data mới nhất
      loadCollection();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  useEffect(() => {
    if (collection) {
      setEditName(collection.name);
      setEditDescription(collection.description || '');
    }
  }, [collection]);

  const loadCollection = async () => {
    if (!collectionId) return;
    
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        toast.error('Chưa đăng nhập');
        navigate('/');
        return;
      }

      const updatedCollection = await getCollection(collectionId);
      console.log('Loaded collection data:', { id: updatedCollection.id, name: updatedCollection.name, data: updatedCollection.data });
      
      // Parse collection data - xử lý nhiều format khác nhau
      let requests: any[] = [];
      if (updatedCollection.data) {
        if (typeof updatedCollection.data === 'string') {
          try {
            const parsedData = JSON.parse(updatedCollection.data);
            if (Array.isArray(parsedData)) {
              requests = parsedData;
            } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.requests)) {
              requests = parsedData.requests;
            }
          } catch (e) {
            console.error('Error parsing collection data (string):', e);
          }
        } else if (Array.isArray(updatedCollection.data)) {
          // Nếu data là array trực tiếp
          requests = updatedCollection.data;
        } else if (typeof updatedCollection.data === 'object' && updatedCollection.data !== null) {
          // Nếu data là object, kiểm tra requests property
          if (Array.isArray(updatedCollection.data.requests)) {
            requests = updatedCollection.data.requests;
          } else if (updatedCollection.data.requests && typeof updatedCollection.data.requests === 'string') {
            // Nếu requests là string, parse nó
            try {
              const parsed = JSON.parse(updatedCollection.data.requests);
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
      const normalizedId = updatedCollection.id?.toString() || collectionId.toString();
      const collectionData = {
        ...updatedCollection,
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
    } catch (error: any) {
      console.error('Failed to load collection:', error);
      toast.error(error.message || 'Không thể tải collection');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionId) return;

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
        toast.success('Đã xóa collection thành công');
        navigate('/');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể xóa collection');
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa collection');
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
            description: editDescription,
          }),
        }
      );

      if (response.ok) {
        toast.success('Đã cập nhật collection thành công');
        setShowEditModal(false);
        await loadCollection();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Không thể cập nhật collection');
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật collection');
    }
  };

  // Xác định tab hiện tại dựa trên URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/requests')) return 'requests';
    if (path.includes('/documentation')) return 'documentation';
    if (path.includes('/members')) return 'members';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/discussions')) return 'discussions';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/activity')) return 'activity';
    return 'requests';
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (tab: string) => {
    if (!collectionId) return;
    navigate(`/collections/${collectionId}/${tab}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Collection không tồn tại
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Quay lại
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1"
            >
              <Edit2 size={16} />
              Sửa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 text-red-600 dark:text-red-400"
            >
              <Trash2 size={16} />
              Xóa
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 -mb-[-1px]">
          <TabButton
            active={currentTab === 'requests'}
            onClick={() => handleTabChange('requests')}
            icon={FileCode}
          >
            Requests ({collection.requests?.length || 0})
          </TabButton>
          <TabButton
            active={currentTab === 'documentation'}
            onClick={() => handleTabChange('documentation')}
            icon={Folder}
          >
            Documentation
          </TabButton>
          <TabButton
            active={currentTab === 'members'}
            onClick={() => handleTabChange('members')}
            icon={Users}
          >
            Members
          </TabButton>
          <TabButton
            active={currentTab === 'tasks'}
            onClick={() => handleTabChange('tasks')}
            icon={CheckSquare}
          >
            Tasks
          </TabButton>
          <TabButton
            active={currentTab === 'discussions'}
            onClick={() => handleTabChange('discussions')}
            icon={MessageSquare}
          >
            Discussions
          </TabButton>
          <TabButton
            active={currentTab === 'reviews'}
            onClick={() => handleTabChange('reviews')}
            icon={FileCheck}
          >
            Reviews
          </TabButton>
          <TabButton
            active={currentTab === 'activity'}
            onClick={() => handleTabChange('activity')}
            icon={Activity}
          >
            Activity
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
              Sửa Collection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên Collection
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Collection name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Collection description"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateCollection}
                disabled={!editName.trim()}
              >
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Xóa Collection
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bạn có chắc chắn muốn xóa collection này? Tất cả requests trong collection sẽ bị xóa. Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCollection}
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
