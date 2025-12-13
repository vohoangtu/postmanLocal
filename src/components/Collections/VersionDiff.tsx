import { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import { X, GitCompare } from "lucide-react";
import Editor from "@monaco-editor/react";
import { diffObjects, formatDiff } from "../../utils/diff";

interface VersionDiffProps {
  collectionId: string;
  versionId: string;
  onClose: () => void;
}

export default function VersionDiff({ collectionId, versionId, onClose }: VersionDiffProps) {
  const [versionData, setVersionData] = useState<any>(null);
  const [currentData, setCurrentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified" | "diff">("side-by-side");
  const [diffs, setDiffs] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    loadVersionData();
  }, [collectionId, versionId]);

  const loadVersionData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      // Load version
      const versionResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/versions/${versionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (versionResponse.ok) {
        const version = await versionResponse.json();
        setVersionData(version.data);
      }

      // Load current collection
      const currentResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (currentResponse.ok) {
        const collection = await currentResponse.json();
        const current = {
          name: collection.name,
          description: collection.description,
          data: collection.data,
        };
        setCurrentData(current);

        // Calculate diffs
        if (version.data) {
          const diffResults = diffObjects(version.data, current);
          setDiffs(diffResults);
        }
      }
    } catch (error) {
      console.error("Failed to load version data:", error);
      toast.error("Failed to load version data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[90vw] h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GitCompare size={18} />
            Version Comparison
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="side-by-side">Side by Side</option>
              <option value="unified">Unified</option>
              <option value="diff">Diff View</option>
            </select>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </div>

        {viewMode === "diff" ? (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Differences ({diffs.length})
              </h4>
              {diffs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No differences found
                </p>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {diffs.map((diff, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        diff.type === "added"
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : diff.type === "removed"
                          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                          : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {diff.type === "added" && "+ "}
                        {diff.type === "removed" && "- "}
                        {diff.type === "modified" && "~ "}
                        {diff.path}
                      </div>
                      {diff.oldValue !== undefined && (
                        <div className="text-red-600 dark:text-red-400 mt-1">
                          Old: {JSON.stringify(diff.oldValue)}
                        </div>
                      )}
                      {diff.newValue !== undefined && (
                        <div className="text-green-600 dark:text-green-400 mt-1">
                          New: {JSON.stringify(diff.newValue)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Version
              </h4>
              <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={JSON.stringify(currentData, null, 2)}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Version {versionData ? "Snapshot" : ""}
              </h4>
              <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={versionData ? JSON.stringify(versionData, null, 2) : ""}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


