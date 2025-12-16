import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useCollectionStore } from "../../stores/collectionStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { loadCollections } from "../../services/storageService";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { setDefaultCollection as setDefaultCollectionAPI } from "../../services/collectionService";
import { useEnvironmentStore } from "../../stores/environmentStore";
import EmptyState from "../EmptyStates/EmptyState";
import FolderManager from "../Folders/FolderManager";
import ShareCollectionModal from "./ShareCollectionModal";
import CollectionPermissionBadge from "./CollectionPermissionBadge";
import CommentsPanel from "../Comments/CommentsPanel";
import VersionHistory from "./VersionHistory";
import Button from "../UI/Button";
import Select from "../UI/Select";
import { Folder, Share2, MessageSquare, History, FileCode, Upload } from "lucide-react";

function CollectionManager() {
  const {
    collections,
    setCollections,
    selectedCollection,
    setSelectedCollection,
    defaultCollectionId,
    setDefaultCollectionId,
    updateCollection,
    deleteCollection,
    reloadTrigger,
    triggerReload,
  } = useCollectionStore();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { activeEnvironment, environments, setActiveEnvironment } = useEnvironmentStore();
  const { workspaces, activeWorkspace } = useWorkspaceStore();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingCollectionId, setSharingCollectionId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPublishTemplateModal, setShowPublishTemplateModal] = useState(false);
  const [publishingCollectionId, setPublishingCollectionId] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateTags, setTemplateTags] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [editingCollection, setEditingCollection] = useState<string | null>(null);

  const loadCollectionsData = useCallback(async () => {
    try {
      // Nếu đã đăng nhập, load từ backend API
      if (isAuthenticated) {
        const token = await authService.getAccessToken();
        if (!token) {
          console.warn('User is authenticated but token is missing');
          // Fallback to local storage
        } else {
          // Filter collections theo workspace nếu có active workspace
          const url = activeWorkspace 
            ? `${API_BASE_URL}/collections?workspace_id=${activeWorkspace}`
            : `${API_BASE_URL}/collections`;
          
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            // Xử lý paginated response hoặc array
            const collectionsList = Array.isArray(data) ? data : (data.data || []);
            setCollections(collectionsList.map((c: any) => {
              // Parse requests từ collection.data.requests
              let requests: any[] = [];
              
              // Xử lý nhiều format khác nhau của c.data
              if (c.data) {
                if (typeof c.data === 'string') {
                  // Nếu data là string, parse JSON
                  try {
                    const parsedData = JSON.parse(c.data);
                    if (Array.isArray(parsedData)) {
                      requests = parsedData;
                    } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.requests)) {
                      requests = parsedData.requests;
                    }
                  } catch (e) {
                    console.error('Error parsing collection data (string):', e, 'Data:', c.data);
                  }
                } else if (Array.isArray(c.data)) {
                  // Nếu data là array trực tiếp (legacy format)
                  requests = c.data;
                } else if (typeof c.data === 'object' && c.data !== null) {
                  // Nếu data là object, kiểm tra requests property
                  if (Array.isArray(c.data.requests)) {
                    requests = c.data.requests;
                  } else if (c.data.requests && typeof c.data.requests === 'string') {
                    // Nếu requests là string, parse nó
                    try {
                      const parsed = JSON.parse(c.data.requests);
                      requests = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                      console.error('Error parsing requests string:', e);
                    }
                  } else if (c.data.requests && !Array.isArray(c.data.requests)) {
                    // Nếu requests không phải array, thử convert
                    console.warn('Collection requests is not an array:', {
                      collectionId: c.id,
                      collectionName: c.name,
                      requestsType: typeof c.data.requests,
                      requests: c.data.requests
                    });
                  }
                }
              }
              
              // Đảm bảo requests luôn là array
              if (!Array.isArray(requests)) {
                console.warn('Requests is not an array, converting:', {
                  collectionId: c.id,
                  collectionName: c.name,
                  requests
                });
                requests = [];
              }
              
              // Debug logging để kiểm tra (chỉ log khi có vấn đề)
              if (requests.length === 0 && c.data && (typeof c.data === 'object' || typeof c.data === 'string')) {
                console.log('Collection has data but no requests parsed:', {
                  collectionId: c.id,
                  collectionName: c.name,
                  dataType: typeof c.data,
                  dataKeys: typeof c.data === 'object' && c.data !== null ? Object.keys(c.data) : null,
                  hasRequestsKey: typeof c.data === 'object' && c.data !== null ? 'requests' in c.data : false,
                  parsedRequests: requests.length
                });
              }

              return {
                id: c.id?.toString() || c.id || Date.now().toString(),
                name: c.name || "Unnamed Collection",
                description: c.description || "",
                requests: requests,
                is_shared: c.is_shared || false,
                permission: c.permission,
                workspace_id: c.workspace_id?.toString(),
                is_default: c.is_default || false,
              };
            }));
            
            // Tìm và set default collection
            const defaultCollection = collectionsList.find((c: any) => c.is_default === true);
            if (defaultCollection) {
              setDefaultCollectionId(defaultCollection.id?.toString() || defaultCollection.id);
            } else {
              // Edge case: User không có default collection
              console.warn('User không có default collection. Vui lòng tạo collection mới.');
              setDefaultCollectionId(null);
            }
            
            return;
          } else if (response.status === 401) {
            // Token expired hoặc invalid
            console.warn('Token expired or invalid, falling back to local storage');
            // Fallback to local storage
          }
        }
      }

      // Fallback: load từ local storage (cho offline mode hoặc chưa đăng nhập)
      const data = await loadCollections();
      const mappedCollections = data.map((c: any) => ({
        id: c.id?.toString() || c.id || Date.now().toString(),
        name: c.name || "Unnamed Collection",
        description: c.description || "",
        requests: [],
        is_default: c.is_default || false,
      }));
      setCollections(mappedCollections);
      
      // Tìm default collection trong local data
      const defaultCollection = mappedCollections.find((c: any) => c.is_default === true);
      if (defaultCollection) {
        setDefaultCollectionId(defaultCollection.id);
      } else {
        setDefaultCollectionId(null);
      }
    } catch (error) {
      // Silently handle errors in web environment
      if (error instanceof Error && error.message.includes("Tauri API")) {
        setCollections([]);
        return;
      }
      console.error("Failed to load collections:", error);
      setCollections([]);
    }
  }, [setCollections, isAuthenticated, API_BASE_URL]);

  useEffect(() => {
    loadCollectionsData();
  }, [loadCollectionsData]);

  // Reload khi authentication state thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      loadCollectionsData();
    }
  }, [isAuthenticated, loadCollectionsData]);

  // Reload khi có trigger từ bên ngoài (ví dụ: sau khi import)
  useEffect(() => {
    if (reloadTrigger > 0) {
      loadCollectionsData();
    }
  }, [reloadTrigger, loadCollectionsData]);

  // Reload collections khi active workspace thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      loadCollectionsData();
    }
  }, [activeWorkspace, isAuthenticated, loadCollectionsData]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      // Nếu đã đăng nhập, lưu vào backend API
      if (isAuthenticated) {
        const token = await authService.getAccessToken();
        if (!token) {
          toast.error("Token không tồn tại. Vui lòng đăng nhập lại.");
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/collections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newCollectionName,
              description: newCollectionDescription || null,
              data: null,
              workspace_id: selectedWorkspaceId || activeWorkspace || null,
            }),
          });
          if (response.ok) {
            const createdCollection = await response.json();
            const newCollection = {
              id: createdCollection.id?.toString() || createdCollection.id,
              name: createdCollection.name,
              description: createdCollection.description || "",
              requests: [],
              is_shared: createdCollection.is_shared || false,
              permission: createdCollection.permission,
              workspace_id: createdCollection.workspace_id?.toString(),
            };
            setCollections([...collections, newCollection]);
            setNewCollectionName("");
            setNewCollectionDescription("");
            setSelectedWorkspaceId(null);
            setShowCreateModal(false);
            toast.success("Collection created successfully");
            return;
          } else if (response.status === 401) {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
          } else {
            let errorMessage = "Failed to create collection";
            try {
              const error = await response.json();
              errorMessage = error.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            toast.error(errorMessage);
            return;
          }
        } catch (error: any) {
          console.error("Error creating collection:", error);
          toast.error(error?.message || "Không thể tạo collection. Vui lòng thử lại.");
          return;
        }
      }

      // Fallback: lưu vào local storage (cho offline mode)
      const newCollection = {
        id: Date.now().toString(),
        name: newCollectionName,
        description: newCollectionDescription,
        requests: [],
      };

      setCollections([...collections, newCollection]);
      
      // Lưu vào localStorage
      const collectionsJson = localStorage.getItem('postmanlocal_collections');
      const existingCollections = collectionsJson ? JSON.parse(collectionsJson) : [];
      existingCollections.push(newCollection);
      localStorage.setItem('postmanlocal_collections', JSON.stringify(existingCollections));

      setNewCollectionName("");
      setNewCollectionDescription("");
      setSelectedWorkspaceId(null);
      setShowCreateModal(false);
      toast.success("Collection created successfully");
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast.error(error.message || "Failed to create collection");
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection || !newCollectionName.trim()) return;

    try {
      // Nếu đã đăng nhập, cập nhật qua backend API
      if (isAuthenticated) {
        const token = await authService.getAccessToken();
        if (!token) {
          toast.error("Token không tồn tại. Vui lòng đăng nhập lại.");
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/collections/${editingCollection}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newCollectionName,
              description: newCollectionDescription || null,
            }),
          });

          if (response.ok) {
            const updatedCollection = await response.json();
            updateCollection(editingCollection, {
              name: updatedCollection.name,
              description: updatedCollection.description || "",
            });
            setEditingCollection(null);
            setNewCollectionName("");
            setNewCollectionDescription("");
            setShowEditModal(false);
            toast.success("Collection updated successfully");
            return;
          } else if (response.status === 401) {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
          } else {
            let errorMessage = "Failed to update collection";
            try {
              const error = await response.json();
              errorMessage = error.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            toast.error(errorMessage);
            return;
          }
        } catch (error: any) {
          console.error("Error updating collection:", error);
          toast.error(error?.message || "Không thể cập nhật collection. Vui lòng thử lại.");
          return;
        }
      }

      // Fallback: cập nhật local
      updateCollection(editingCollection, {
        name: newCollectionName,
        description: newCollectionDescription,
      });

      // Lưu vào localStorage
      const collectionsJson = localStorage.getItem('postmanlocal_collections');
      if (collectionsJson) {
        const existingCollections = JSON.parse(collectionsJson);
        const index = existingCollections.findIndex((c: any) => c.id === editingCollection);
        if (index >= 0) {
          existingCollections[index] = {
            ...existingCollections[index],
            name: newCollectionName,
            description: newCollectionDescription,
          };
          localStorage.setItem('postmanlocal_collections', JSON.stringify(existingCollections));
        }
      }

      setEditingCollection(null);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setShowEditModal(false);
      toast.success("Collection updated successfully");
    } catch (error: any) {
      console.error("Error updating collection:", error);
      toast.error(error.message || "Failed to update collection");
    }
  };

  const handleDeleteCollection = async () => {
    if (!editingCollection) return;

    try {
      // Nếu đã đăng nhập, xóa qua backend API
      if (isAuthenticated) {
        const token = await authService.getAccessToken();
        if (!token) {
          toast.error("Token không tồn tại. Vui lòng đăng nhập lại.");
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/collections/${editingCollection}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok || response.status === 204) {
            deleteCollection(editingCollection);
            setEditingCollection(null);
            setShowDeleteConfirm(false);
            toast.success("Collection deleted successfully");
            return;
          } else if (response.status === 401) {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
          } else {
            let errorMessage = "Failed to delete collection";
            try {
              const error = await response.json();
              errorMessage = error.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            toast.error(errorMessage);
            return;
          }
        } catch (error: any) {
          console.error("Error deleting collection:", error);
          toast.error(error?.message || "Không thể xóa collection. Vui lòng thử lại.");
          return;
        }
      }

      // Fallback: xóa local
      deleteCollection(editingCollection);

      // Xóa khỏi localStorage
      const collectionsJson = localStorage.getItem('postmanlocal_collections');
      if (collectionsJson) {
        const existingCollections = JSON.parse(collectionsJson);
        const filtered = existingCollections.filter((c: any) => c.id !== editingCollection);
        localStorage.setItem('postmanlocal_collections', JSON.stringify(filtered));
      }

      setEditingCollection(null);
      setShowDeleteConfirm(false);
      toast.success("Collection deleted successfully");
    } catch (error: any) {
      console.error("Error deleting collection:", error);
      toast.error(error.message || "Failed to delete collection");
    }
  };

  const openEditModal = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (collection) {
      setEditingCollection(collectionId);
      setNewCollectionName(collection.name);
      setNewCollectionDescription(collection.description || "");
      setShowEditModal(true);
    }
  };

  const openDeleteConfirm = (collectionId: string) => {
    setEditingCollection(collectionId);
    setShowDeleteConfirm(true);
  };

  const handlePublishAsTemplate = (collectionId: string) => {
    setPublishingCollectionId(collectionId);
    setTemplateCategory("");
    setTemplateTags("");
    setShowPublishTemplateModal(true);
  };

  const handlePublishTemplate = async () => {
    if (!publishingCollectionId) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để publish template");
        return;
      }

      const tags = templateTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${publishingCollectionId}/publish-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: templateCategory || null,
            tags: tags.length > 0 ? tags : null,
          }),
        }
      );

      if (response.ok) {
        toast.success("Collection đã được publish thành template");
        setShowPublishTemplateModal(false);
        setPublishingCollectionId(null);
        setTemplateCategory("");
        setTemplateTags("");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to publish template");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish template");
    }
  };

  // Filter collections theo active workspace
  const filteredCollections = useMemo(() => {
    if (!activeWorkspace) {
      // Nếu không có active workspace, hiển thị tất cả collections không có workspace
      return collections.filter(c => !c.workspace_id);
    }
    // Nếu có active workspace, chỉ hiển thị collections thuộc workspace đó
    return collections.filter(c => c.workspace_id === activeWorkspace);
  }, [collections, activeWorkspace]);

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Select
          value={activeEnvironment || ""}
          onChange={(e) => setActiveEnvironment(e.target.value || null)}
          options={[
            { value: "", label: "No Environment" },
            ...environments.map((env) => ({
              value: env.id,
              label: env.name,
            })),
          ]}
          fullWidth
        />
        {workspaces.length > 0 && (
          <Select
            value={activeWorkspace || ""}
            onChange={(e) => {
              const { setActiveWorkspace } = useWorkspaceStore.getState();
              setActiveWorkspace(e.target.value || null);
            }}
            options={[
              { value: "", label: "All Collections (No Workspace)" },
              ...workspaces.map((w) => ({
                value: w.id.toString(),
                label: `${w.name} ${w.is_team ? "(Team)" : "(Personal)"}`,
              })),
            ]}
            fullWidth
          />
        )}
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="w-full"
        >
          + New Collection
        </Button>
      </div>

      <div className="space-y-1">
        {filteredCollections.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No collections yet"
            description="Create your first collection to organize API requests"
            action={{
              label: "Create Collection",
              onClick: () => setShowCreateModal(true),
            }}
            suggestions={[
              "Organize requests by feature or team",
              "Use folders to group related requests",
              "Import from Postman to get started quickly",
            ]}
          />
        ) : (
          filteredCollections.map((collection) => (
          <div
            key={collection.id}
            className={`group p-2 rounded text-sm ${
              selectedCollection === collection.id
                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                : collection.is_default
                ? "bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className="cursor-pointer flex-1"
                onClick={() => setSelectedCollection(collection.id)}
              >
                <div className="flex items-center gap-2">
                  <span>{collection.name}</span>
                  {collection.is_default && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      Default
                    </span>
                  )}
                  <CollectionPermissionBadge
                    isShared={collection.is_shared || false}
                    permission={collection.permission}
                  />
                </div>
              </div>
            </div>
            {selectedCollection === collection.id && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <FolderManager collectionId={collection.id} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare size={14} />
                    Comments
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className="flex items-center gap-1"
                  >
                    <History size={14} />
                    Versions
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handlePublishAsTemplate(collection.id)}
                    className="flex items-center gap-1"
                  >
                    <FileCode size={14} />
                    Publish Template
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSharingCollectionId(collection.id);
                      setShowShareModal(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Share2 size={14} />
                    Share
                  </Button>
                  {!collection.is_default && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={async () => {
                        try {
                          await setDefaultCollectionAPI(collection.id);
                          setDefaultCollectionId(collection.id);
                          triggerReload();
                          toast.success(`"${collection.name}" đã được set làm default collection`);
                        } catch (error: any) {
                          toast.error(error?.message || "Không thể set default collection");
                        }
                      }}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openEditModal(collection.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => openDeleteConfirm(collection.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    disabled={collection.is_default}
                    title={collection.is_default ? "Không thể xóa default collection" : ""}
                  >
                    Delete
                  </Button>
                </div>
                {showComments && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <CommentsPanel collectionId={collection.id} />
                  </div>
                )}
                {showVersionHistory && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <VersionHistory
                      collectionId={collection.id}
                      onClose={() => setShowVersionHistory(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Collection
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === "Enter" && handleCreateCollection()}
              />
              <textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                rows={3}
              />
              {workspaces.length > 0 && (
                <Select
                  label="Workspace (Optional)"
                  value={selectedWorkspaceId || activeWorkspace || ""}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value || null)}
                  options={[
                    { value: "", label: "No Workspace (Personal)" },
                    ...workspaces.map((w) => ({
                      value: w.id.toString(),
                      label: `${w.name} ${w.is_team ? "(Team)" : "(Personal)"}`,
                    })),
                  ]}
                  fullWidth
                />
              )}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateCollection}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Collection
            </h3>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <textarea
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCollection(null);
                  setNewCollectionName("");
                  setNewCollectionDescription("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEditCollection}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Collection
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this collection? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEditingCollection(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteCollection}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && sharingCollectionId && (
        <ShareCollectionModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSharingCollectionId(null);
          }}
          collectionId={sharingCollectionId}
          collectionName={collections.find((c) => c.id === sharingCollectionId)?.name || ""}
          onShareSuccess={() => {
            loadCollectionsData();
          }}
        />
      )}

      {showPublishTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Publish as Template
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="e.g., REST API, GraphQL, Authentication"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={templateTags}
                  onChange={(e) => setTemplateTags(e.target.value)}
                  placeholder="e.g., api, rest, crud"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Separate tags with commas
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPublishTemplateModal(false);
                  setPublishingCollectionId(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePublishTemplate}>
                <Upload size={14} className="mr-1" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CollectionManager);


