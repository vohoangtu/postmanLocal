import { useState, useEffect } from "react";
import { useCollectionStore } from "../../stores/collectionStore";
import { useToast } from "../../hooks/useToast";
import Button from "../UI/Button";
import { Clock, RotateCcw, Eye, X } from "lucide-react";
import VersionDiff from "./VersionDiff";

interface Version {
  id: string;
  version_number: number;
  description?: string;
  created_at: string;
  created_by?: {
    id: string;
    name: string;
  };
}

interface VersionHistoryProps {
  collectionId: string;
  onClose?: () => void;
}

export default function VersionHistory({ collectionId, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [comparingVersions, setComparingVersions] = useState<[string | null, string | null]>([null, null]);
  const toast = useToast();

  useEffect(() => {
    loadVersions();
  }, [collectionId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/versions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/versions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: `Version created at ${new Date().toLocaleString()}`,
          }),
        }
      );

      if (response.ok) {
        toast.success("Version created successfully");
        await loadVersions();
      } else {
        toast.error("Failed to create version");
      }
    } catch (error) {
      toast.error("Failed to create version");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("Bạn có chắc muốn restore collection về version này?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/restore/${versionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Collection restored successfully");
        await loadVersions();
      } else {
        toast.error("Failed to restore version");
      }
    } catch (error) {
      toast.error("Failed to restore version");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Version History
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateVersion}
            disabled={loading}
          >
            Create Version
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {loading && versions.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          Loading versions...
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          No versions yet. Create a version to track changes.
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div
              key={version.id}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Version {version.version_number}
                  </span>
                  {version.description && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {version.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVersion(version.id)}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(version.id)}
                    disabled={loading}
                  >
                    <RotateCcw size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock size={12} />
                {formatDate(version.created_at)}
                {version.created_by && (
                  <>
                    <span>•</span>
                    <span>by {version.created_by.name}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVersion && (
        <VersionDiff
          collectionId={collectionId}
          versionId={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}
    </div>
  );
}


