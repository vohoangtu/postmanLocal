/**
 * Workspace Notifications Component
 * Filter và hiển thị notifications cho workspace
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { authService } from '../../services/authService';
import { Bell, CheckCircle2, Circle, X } from 'lucide-react';
import EmptyState from '../EmptyStates/EmptyState';
import Button from '../UI/Button';

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export default function WorkspaceNotifications() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadNotifications();
    }
  }, [id, loadWorkspace]);

  const loadNotifications = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/notifications?workspace_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const notifs = Array.isArray(data) ? data : (data.data || []);
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_completed':
        return <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />;
      case 'discussion_reply':
      case 'mention':
        return <Bell size={16} className="text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Bell size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const workspaceNotifications = notifications.filter((n) => {
    if (n.data?.workspace_id) {
      return n.data.workspace_id.toString() === id;
    }
    return true;
  });

  const unreadCount = workspaceNotifications.filter((n) => !n.read).length;

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
      </div>

      {workspaceNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        <div className="space-y-2">
          {workspaceNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-2 ${
                notification.read
                  ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              } shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-white'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1"
                    >
                      <CheckCircle2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
