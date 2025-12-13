import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useCollectionStore } from "../../stores/collectionStore";
import { loadCollections } from "../../services/storageService";
import { useToast } from "../../hooks/useToast";
import EmptyState from "../EmptyStates/EmptyState";
import FolderManager from "../Folders/FolderManager";
import ShareCollectionModal from "./ShareCollectionModal";
import CollectionPermissionBadge from "./CollectionPermissionBadge";
import CommentsPanel from "../Comments/CommentsPanel";
import VersionHistory from "./VersionHistory";
import Button from "../UI/Button";
import { Folder, Share2, MessageSquare, History, FileCode, Upload } from "lucide-react";

function CollectionManager() {
  const {
    collections,
    setCollections,
    selectedCollection,
    setSelectedCollection,
    updateCollection,
    deleteCollection,
  } = useCollectionStore();
  const toast = useToast();
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

  useEffect(() => {
    loadCollectionsData();
  }, []);

  const loadCollectionsData = useCallback(async () => {
    try {
      const data = await loadCollections();
      setCollections(data.map((c: any) => ({
        id: c.id?.toString() || c.id || Date.now().toString(),
        name: c.name || "Unnamed Collection",
        description: c.description || "",
        requests: [],
      })));
    } catch (error) {
      // Silently handle errors in web environment
      if (error instanceof Error && error.message.includes("Tauri API")) {
        setCollections([]);
        return;
      }
      console.error("Failed to load collections:", error);
      setCollections([]);
    }
  }, [setCollections]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      description: newCollectionDescription,
      requests: [],
    };

    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setShowCreateModal(false);
    toast.success("Collection created successfully");
  };

  const handleEditCollection = () => {
    if (!editingCollection || !newCollectionName.trim()) return;

    updateCollection(editingCollection, {
      name: newCollectionName,
      description: newCollectionDescription,
    });

    setEditingCollection(null);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setShowEditModal(false);
    toast.success("Collection updated successfully");
  };

  const handleDeleteCollection = () => {
    if (!editingCollection) return;

    deleteCollection(editingCollection);
    setEditingCollection(null);
    setShowDeleteConfirm(false);
    toast.success("Collection deleted successfully");
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

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        onClick={() => setShowCreateModal(true)}
        className="w-full"
      >
        + New Collection
      </Button>

      <div className="space-y-1">
        {collections.length === 0 ? (
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
          collections.map((collection) => (
          <div
            key={collection.id}
            className={`group p-2 rounded text-sm ${
              selectedCollection === collection.id
                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
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
                  <CollectionPermissionBadge
                    isShared={collection.is_shared || false}
                    permission={collection.permission}
                  />
                </div>
              </div>
            </div>
            {selectedCollection === collection.id && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <FolderManager />
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
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && handleCreateCollection()}
            />
            <textarea
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
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


