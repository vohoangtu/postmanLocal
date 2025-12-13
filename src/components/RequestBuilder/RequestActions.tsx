import { useState } from "react";
import { useTabStore } from "../../stores/tabStore";
import Button from "../UI/Button";

interface RequestActionsProps {
  tabId: string;
  onDuplicate?: () => void;
  onRename?: (newName: string) => void;
}

export default function RequestActions({ tabId, onDuplicate, onRename }: RequestActionsProps) {
  const { getTab, addTab, updateTab } = useTabStore();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState("");

  const tab = getTab(tabId);
  if (!tab) return null;

  const handleDuplicate = () => {
    if (tab) {
      addTab({
        name: `${tab.name} (Copy)`,
        method: tab.method,
        url: tab.url,
        requestData: tab.requestData,
      });
      onDuplicate?.();
    }
  };

  const handleRename = () => {
    if (newName.trim() && tab) {
      updateTab(tabId, { name: newName.trim() });
      setShowRenameModal(false);
      setNewName("");
      onRename?.(newName.trim());
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={handleDuplicate}
        title="Duplicate request"
      >
        Duplicate
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          setNewName(tab.name);
          setShowRenameModal(true);
        }}
        title="Rename request"
      >
        Rename
      </Button>

      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Rename Request
            </h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Request name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => {
                setShowRenameModal(false);
                setNewName("");
              }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRename}>
                Rename
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

