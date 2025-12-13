import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  onShareSuccess?: () => void;
}

interface Share {
  id: string;
  shared_with_user: {
    id: string;
    name: string;
    email: string;
  };
  permission: "read" | "write" | "admin";
  shared_by: {
    id: string;
    name: string;
  };
}

export default function ShareCollectionModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  onShareSuccess,
}: ShareCollectionModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read" | "write" | "admin">("read");
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, collectionId]);

  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      // Load collection với shares
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const collection = await response.json();
        // Backend should return shares relationship
        if (collection.shares && Array.isArray(collection.shares)) {
          setShares(collection.shares.map((s: any) => ({
            id: s.id.toString(),
            shared_with_user: {
              id: s.shared_with_user_id?.toString() || s.shared_with_user?.id?.toString() || "",
              name: s.shared_with_user?.name || s.sharedWithUser?.name || "Unknown",
              email: s.shared_with_user?.email || s.sharedWithUser?.email || "",
            },
            permission: s.permission,
            shared_by: {
              id: s.shared_by_id?.toString() || s.shared_by?.id?.toString() || "",
              name: s.shared_by?.name || s.sharedBy?.name || "Unknown",
            },
          })));
        } else {
          setShares([]);
        }
      }
    } catch (error) {
      console.error("Failed to load shares:", error);
      setShares([]);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/share`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, permission }),
        }
      );

      if (response.ok) {
        toast.success("Collection shared successfully");
        setEmail("");
        setPermission("read");
        await loadShares();
        onShareSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to share collection");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to share collection");
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (shareId: string) => {
    if (!confirm("Bạn có chắc muốn unshare collection này?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/share/${shareId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Collection unshared successfully");
        await loadShares();
        onShareSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to unshare collection");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to unshare collection");
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: "read" | "write" | "admin") => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/permission`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shareId,
            permission: newPermission,
          }),
        }
      );

      if (response.ok) {
        toast.success("Permission updated successfully");
        await loadShares();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update permission");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update permission");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Collection: {collectionName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Share Form */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Share with User
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as "read" | "write" | "admin")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                variant="primary"
                onClick={handleShare}
                disabled={loading || !email.trim()}
              >
                {loading ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>

          {/* Current Shares */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shared With
            </h4>
            {loadingShares ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No shares yet. Share this collection to collaborate.
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {share.shared_with_user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {share.shared_with_user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {share.shared_with_user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={share.permission}
                        onChange={(e) =>
                          handleUpdatePermission(share.id, e.target.value as "read" | "write" | "admin")
                        }
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="read">Read</option>
                        <option value="write">Write</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnshare(share.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


