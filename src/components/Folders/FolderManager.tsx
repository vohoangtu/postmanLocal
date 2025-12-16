import { useState, useMemo } from "react";
import Button from "../UI/Button";
import Select from "../UI/Select";
import { useCollectionStore } from "../../stores/collectionStore";
import { useTabStore } from "../../stores/tabStore";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { Play, Folder as FolderIcon } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  requests: Array<{
    id: string;
    name: string;
    method: string;
    url: string;
  }>;
}

interface FolderManagerProps {
  collectionId?: string;
}

export default function FolderManager({ collectionId }: FolderManagerProps) {
  const { collections, selectedCollection } = useCollectionStore();
  const { addTab } = useTabStore();
  const { activeEnvironment, environments, setActiveEnvironment } = useEnvironmentStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Lấy collection hiện tại
  const currentCollection = useMemo(() => {
    const id = collectionId || selectedCollection;
    return collections.find(c => c.id === id);
  }, [collections, collectionId, selectedCollection]);

  // Lấy requests không có folder (uncategorized)
  const uncategorizedRequests = useMemo(() => {
    if (!currentCollection) return [];
    return currentCollection.requests.filter(r => !r.folderId);
  }, [currentCollection]);

  // Xử lý click vào request để mở trong tab mới
  const handleRequestClick = (request: any) => {
    if (!currentCollection) return;
    
    // Chuyển đổi headers từ object sang array format (deep copy để tránh reference sharing)
    const headersArray = request.headers 
      ? Object.entries(request.headers).map(([key, value]) => ({
          key: String(key),
          value: String(value),
        }))
      : [];
    
    // Chuyển đổi queryParams nếu có (deep copy)
    const queryParamsArray = request.queryParams 
      ? request.queryParams.map((qp: any) => ({
          key: String(qp.key || ''),
          value: String(qp.value || ''),
          enabled: qp.enabled !== undefined ? Boolean(qp.enabled) : true,
        }))
      : [];
    
    // Deep copy body để tránh reference sharing
    const bodyCopy = request.body ? String(request.body) : undefined;
    
    // Tạo tab mới với request (đảm bảo tất cả data là deep copy)
    addTab({
      name: String(request.name || 'Untitled Request'),
      method: String(request.method || 'GET'),
      url: String(request.url || ''),
      requestData: {
        headers: headersArray,
        body: bodyCopy,
        queryParams: queryParamsArray,
      },
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      requests: [],
    };

    setFolders([...folders, newFolder]);
    setNewFolderName("");
    setShowCreateFolder(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm("Are you sure you want to delete this folder?")) {
      setFolders(folders.filter((f) => f.id !== folderId));
    }
  };

  // Nhóm requests theo folder
  const requestsByFolder = useMemo(() => {
    if (!currentCollection) return {};
    
    const grouped: Record<string, any[]> = {};
    currentCollection.requests.forEach(request => {
      const folderId = request.folderId || 'uncategorized';
      if (!grouped[folderId]) {
        grouped[folderId] = [];
      }
      grouped[folderId].push(request);
    });
    
    return grouped;
  }, [currentCollection]);

  // Lấy danh sách folder IDs từ requests (để hiển thị folders thực tế từ collection data)
  const folderIdsFromRequests = useMemo(() => {
    if (!currentCollection) return [];
    const folderIds = new Set<string>();
    currentCollection.requests.forEach(request => {
      if (request.folderId) {
        folderIds.add(request.folderId);
      }
    });
    return Array.from(folderIds);
  }, [currentCollection]);

  if (!currentCollection) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 p-2">
        Chọn một collection để xem requests
      </div>
    );
  }

  // Debug log để kiểm tra
  if (currentCollection.requests.length > 0) {
    console.log('FolderManager - Current collection:', {
      id: currentCollection.id,
      name: currentCollection.name,
      requestsCount: currentCollection.requests.length,
      uncategorizedCount: uncategorizedRequests.length,
      folderIds: folderIdsFromRequests,
      requestsByFolder: Object.keys(requestsByFolder).length
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
          Requests ({currentCollection.requests.length})
        </h4>
        <div className="flex items-center gap-2">
          <Select
            value={activeEnvironment || ""}
            onChange={(e) => setActiveEnvironment(e.target.value || null)}
            options={[
              { value: "", label: "No Env" },
              ...environments.map((env) => ({
                value: env.id,
                label: env.name,
              })),
            ]}
            className="w-32 text-xs"
          />
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
          >
            + New Folder
          </Button>
        </div>
      </div>

      {/* Hiển thị requests không có folder */}
      {uncategorizedRequests.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
            Uncategorized
          </div>
          {uncategorizedRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => handleRequestClick(request)}
              className="group flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {request.method}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                {request.name || 'Untitled Request'}
              </span>
              <Play size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
            </div>
          ))}
        </div>
      )}

      {/* Hiển thị folders từ collection data (folderIds từ requests) */}
      {folderIdsFromRequests.length > 0 && (
        <div className="space-y-1">
          {folderIdsFromRequests.map((folderId) => {
            const folderRequests = requestsByFolder[folderId] || [];
            if (folderRequests.length === 0) return null;
            
            return (
              <div key={folderId} className="space-y-1">
                <div className="group flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-2 flex-1">
                    <FolderIcon size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      Folder {folderId}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({folderRequests.length})
                    </span>
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  {folderRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestClick(request)}
                      className="group flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {request.method}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {request.name || 'Untitled Request'}
                      </span>
                      <Play size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hiển thị folders từ local state (nếu có) - cho tương lai khi có folder management */}
      {folders.length > 0 && (
        <div className="space-y-1">
          {folders.map((folder) => {
            const folderRequests = requestsByFolder[folder.id] || [];
            if (folderRequests.length === 0) return null;
            
            return (
              <div key={folder.id} className="space-y-1">
                <div className="group flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-2 flex-1">
                    <FolderIcon size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{folder.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      ({folderRequests.length})
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 text-xs"
                  >
                    ×
                  </button>
                </div>
                <div className="ml-4 space-y-1">
                  {folderRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestClick(request)}
                      className="group flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {request.method}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">
                        {request.name || 'Untitled Request'}
                      </span>
                      <Play size={12} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hiển thị thông báo nếu không có requests */}
      {currentCollection.requests.length === 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 text-center">
          Chưa có requests nào trong collection này
        </div>
      )}

      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Folder
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateFolder}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

