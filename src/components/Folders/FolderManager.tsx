import { useState } from "react";
import Button from "../UI/Button";

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

export default function FolderManager() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">Folders</h4>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowCreateFolder(true)}
        >
          + New Folder
        </Button>
      </div>

      <div className="space-y-1">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs">📁</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">{folder.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ({folder.requests.length})
              </span>
            </div>
            <button
              onClick={() => handleDeleteFolder(folder.id)}
              className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 text-xs"
            >
              ×
            </button>
          </div>
        ))}
      </div>

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

