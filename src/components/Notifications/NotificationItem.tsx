import { Notification } from "../../stores/activityStore";
import { Clock } from "lucide-react";
import { navigateToEntity } from "../../utils/navigation";

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const isUnread = !notification.read_at;

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

  const handleClick = () => {
    if (isUnread) {
      onRead();
    }
    // Navigate to related entity dựa trên notification type
    if (notification.entity_type && notification.entity_id) {
      navigateToEntity(notification.entity_type, notification.entity_id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 cursor-pointer transition-colors ${
        isUnread
          ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {isUnread && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock size={12} />
            {formatTime(notification.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}


