import { useState, useEffect } from "react";
import { useActivityStore, ActivityLog } from "../../stores/activityStore";
import { Clock, User, Folder, FileText } from "lucide-react";
import Button from "../UI/Button";

interface ActivityFeedProps {
  workspaceId?: string;
  collectionId?: string;
}

export default function ActivityFeed({ workspaceId, collectionId }: ActivityFeedProps) {
  const { activities, setActivities } = useActivityStore();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [workspaceId, collectionId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      let url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/activities`;
      if (collectionId) {
        url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/collections/${collectionId}/activities`;
      } else if (workspaceId) {
        url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/workspaces/${workspaceId}/activities`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || data);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return "➕";
      case "updated":
        return "✏️";
      case "deleted":
        return "🗑️";
      case "shared":
        return "🔗";
      case "commented":
        return "💬";
      case "annotated":
        return "📝";
      default:
        return "📌";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "text-green-600 dark:text-green-400";
      case "updated":
        return "text-blue-600 dark:text-blue-400";
      case "deleted":
        return "text-red-600 dark:text-red-400";
      case "shared":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && activities.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading activities...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No activities yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {activity.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.user?.name || "Unknown"}
                </span>
                <span className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)} {activity.action}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.entity_type}
                </span>
              </div>
              {activity.metadata?.name && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {activity.metadata.name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock size={12} />
                {formatTime(activity.created_at)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}




