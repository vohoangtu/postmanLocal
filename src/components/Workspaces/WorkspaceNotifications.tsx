/**
 * Workspace Notifications Component
 * Hiển thị notifications cho workspace với real-time updates
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNotificationStore, subscribeToNotifications } from '../../stores/notificationStore';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import EmptyState from '../EmptyStates/EmptyState';
import Skeleton from '../UI/Skeleton';
import ErrorMessage from '../Error/ErrorMessage';
import { Bell, Check, CheckCheck, AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';

export default function WorkspaceNotifications() {
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const {
    notifications,
    unreadNotifications,
    loading,
    error,
    loadNotifications,
    loadUnreadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const toast = useToast();
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
      loadNotifications();
      loadUnreadNotifications();
    }
  }, [id, loadWorkspace, loadNotifications, loadUnreadNotifications]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToNotifications(id);
    return unsubscribe;
  }, [id]);

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      await markAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle size={18} className="text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle size={18} className="text-orange-600 dark:text-orange-400" />;
      default:
        return <Info size={18} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  const displayNotifications = notifications.length > 0 ? notifications : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {unreadNotifications.length > 0
              ? `${unreadNotifications.length} unread notification${unreadNotifications.length !== 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <CheckCheck size={16} />
            Mark All Read
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onRetry={() => {
              loadNotifications();
              loadUnreadNotifications();
            }}
          />
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
              <Skeleton variant="text" lines={2} />
            </div>
          ))}
        </div>
      ) : displayNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Notifications will appear here when there are updates in your workspace"
        />
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notification) => {
            const isUnread = !notification.read_at;
            return (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  isUnread
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-700'
                } p-4 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold text-gray-900 dark:text-white ${isUnread ? 'font-bold' : ''}`}>
                        {notification.title}
                      </h4>
                      {isUnread && (
                        <Badge variant="primary" size="sm" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markingAsRead === notification.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Check size={14} />
                          {markingAsRead === notification.id ? 'Marking...' : 'Mark as read'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
