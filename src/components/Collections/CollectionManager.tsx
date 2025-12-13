import { useState, useEffect } from "react";
import { useCollectionStore } from "../../stores/collectionStore";
import { loadCollections } from "../../services/storageService";
import { useToast } from "../../hooks/useToast";
import EmptyState from "../EmptyStates/EmptyState";
import FolderManager from "../Folders/FolderManager";
import Button from "../UI/Button";
import { Folder } from "lucide-react";

export default function CollectionManager() {
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
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [editingCollection, setEditingCollection] = useState<string | null>(null);

  useEffect(() => {
    loadCollectionsData();
  }, []);

  const loadCollectionsData = async () => {
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
  };

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
            <div
              className="cursor-pointer"
              onClick={() => setSelectedCollection(collection.id)}
            >
              {collection.name}
            </div>
            {selectedCollection === collection.id && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <FolderManager />
                <div className="flex gap-2 mt-2">
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
    </div>
  );
}


