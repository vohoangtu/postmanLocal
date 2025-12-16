/**
 * Collection Request Builder
 * Wrapper component để tích hợp RequestBuilder với collection context
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCollectionStore, Request } from '../../stores/collectionStore';
import { useTabStore } from '../../stores/tabStore';
import { useEnvironmentStore } from '../../stores/environmentStore';
import RequestBuilder from '../RequestBuilder/RequestBuilder';
import Button from '../UI/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SkeletonLoader from '../UI/SkeletonLoader';
import { getCollection } from '../../services/collectionService';
import { authService } from '../../services/authService';

export default function CollectionRequestBuilder() {
  const { id: workspaceId, collectionId, requestId } = useParams<{
    id: string;
    collectionId: string;
    requestId: string;
  }>();
  const navigate = useNavigate();
  const { collections, setDefaultCollectionId, updateRequestInCollection, updateCollection, addCollection } = useCollectionStore();
  const { addTab, getTab } = useTabStore();
  const { setWorkspaceEnvironment, loadWorkspaceEnvironments } = useEnvironmentStore();
  const [tabId, setTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalRequestId, setOriginalRequestId] = useState<string | null>(null);
  const [hasSavedRequest, setHasSavedRequest] = useState(false);

  const collection = collectionId ? collections.find((c) => c.id === collectionId) : null;
  const isNewRequest = requestId === 'new';
  const request = !isNewRequest && collection ? collection.requests?.find((r) => r.id === requestId) : null;

  useEffect(() => {
    // Load workspace environments nếu có workspaceId
    if (workspaceId) {
      loadWorkspaceEnvironments(workspaceId);
      setWorkspaceEnvironment(workspaceId);
    } else {
      setWorkspaceEnvironment(null);
    }

    // Set default collection để RequestBuilder có thể save vào collection này
    if (collectionId) {
      setDefaultCollectionId(collectionId);
      
      // Đảm bảo collection được load vào store nếu chưa có
      const loadCollectionIfNeeded = async () => {
        const collectionInStore = collections.find((c) => c.id === collectionId);
        if (!collectionInStore) {
          try {
            const isAuthenticated = await authService.isAuthenticated();
            if (isAuthenticated) {
              const loadedCollection = await getCollection(collectionId);
              // Parse collection.data để lấy requests
              const collectionData = typeof loadedCollection.data === 'string' 
                ? JSON.parse(loadedCollection.data) 
                : loadedCollection.data || {};
              
              const requestsList = collectionData.requests || [];
              
              // Thêm collection vào store nếu chưa có
              const existingIndex = collections.findIndex((c) => c.id === collectionId);
              if (existingIndex >= 0) {
                updateCollection(collectionId, {
                  ...loadedCollection,
                  requests: requestsList,
                });
              } else {
                addCollection({
                  ...loadedCollection,
                  requests: requestsList,
                });
              }
            }
          } catch (error) {
            console.error('Failed to load collection:', error);
          }
        }
      };
      
      loadCollectionIfNeeded();
    }

    // Cleanup: reset workspace environment khi component unmount
    return () => {
      setWorkspaceEnvironment(null);
    };
  }, [workspaceId, collectionId, setDefaultCollectionId, collections, updateCollection, addCollection, loadWorkspaceEnvironments, setWorkspaceEnvironment]);

  useEffect(() => {
    if (isNewRequest) {
      // Tạo tab mới cho request mới
      // addTab là synchronous và trả về id ngay lập tức
      const newTabId = addTab({
        name: 'New Request',
        method: 'GET',
        url: '',
        requestData: {
          headers: [{ key: '', value: '' }],
          body: '',
          queryParams: [{ key: '', value: '', enabled: true }],
        },
      });
      
      // Set tabId ngay lập tức, RequestBuilder sẽ xử lý retry nếu tab chưa có
      setTabId(newTabId);
      setLoading(false);
    } else if (request) {
      // Lưu original request ID để có thể update sau
      setOriginalRequestId(request.id);
      
      // Tạo tab từ request data
      const headersArray = request.headers
        ? Object.entries(request.headers).map(([key, value]) => ({ key, value }))
        : [{ key: '', value: '' }];

      const newTabId = addTab({
        name: request.name,
        method: request.method || 'GET',
        url: request.url || '',
        requestData: {
          headers: headersArray,
          body: request.body || '',
          queryParams: request.queryParams || [{ key: '', value: '', enabled: true }],
        },
      });
      
      // Set tabId ngay lập tức, RequestBuilder sẽ xử lý retry nếu tab chưa có
      setTabId(newTabId);
      setLoading(false);
    } else if (!isNewRequest && !request) {
      // Request không tìm thấy
      setLoading(false);
    }
  }, [isNewRequest, request, addTab]);

  const handleResponse = (responseData: any) => {
    // Response được xử lý bởi RequestBuilder component
    console.log('Response received:', responseData);
  };

  const handleSaveSuccess = () => {
    // Đánh dấu đã save thành công
    // RequestBuilder đã gọi triggerReload() rồi, không cần gọi lại
    setHasSavedRequest(true);
  };

  // Reset hasSavedRequest khi vào trang new request
  useEffect(() => {
    if (isNewRequest) {
      setHasSavedRequest(false);
    }
  }, [isNewRequest]);

  // Navigate về requests list sau khi save thành công
  useEffect(() => {
    // Chỉ navigate nếu:
    // 1. Đang ở trang new request
    // 2. Đã save request thành công (hasSavedRequest = true)
    if (isNewRequest && workspaceId && collectionId && hasSavedRequest) {
      // Đợi một chút để đảm bảo collection đã được reload từ backend
      const timer = setTimeout(() => {
        navigate(`/workspace/${workspaceId}/collections/${collectionId}/requests`);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isNewRequest, workspaceId, collectionId, hasSavedRequest, navigate]);

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}/collections/${collectionId}/requests`);
  };

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Collection not found
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800">
        <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 p-4">
          <Skeleton variant="rectangle" width={200} height={24} />
        </div>
        <div className="flex-1 p-4">
          <SkeletonLoader type="request-builder" />
        </div>
      </div>
    );
  }

  if (!isNewRequest && !request) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Request not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Requests
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isNewRequest ? 'New Request' : request?.name || 'Edit Request'}
          </h2>
        </div>
      </div>

      {/* Request Builder */}
      {/* Render RequestBuilder ngay cả khi chưa có tabId để form hiển thị với default values */}
      <div className="flex-1 overflow-hidden">
        <RequestBuilder
          requestId={null}
          tabId={tabId || undefined}
          onResponse={handleResponse}
          onSaveSuccess={handleSaveSuccess}
        />
      </div>
    </div>
  );
}
