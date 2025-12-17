/**
 * Notification Store
 * Quản lý notifications state và real-time updates
 */

import { create } from 'zustand';
import { authService } from '../services/authService';
import * as notificationService from '../services/notificationService';
import { websocketService } from '../services/websocketService';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadNotifications: Notification[];
  loading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  loadUnreadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadNotifications: [],
  loading: false,
  error: null,

  loadNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await notificationService.getNotifications();
      set({ notifications, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load notifications';
      set({ error: errorMessage, loading: false });
      console.error('Failed to load notifications:', error);
    }
  },

  loadUnreadNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const unreadNotifications = await notificationService.getUnreadNotifications();
      set({ unreadNotifications, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load unread notifications';
      set({ error: errorMessage, loading: false });
      console.error('Failed to load unread notifications:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state optimistically
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadNotifications: state.unreadNotifications.filter((n) => n.id !== notificationId),
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to mark notification as read';
      set({ error: errorMessage });
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state optimistically
      const now = new Date().toISOString();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read_at: now })),
        unreadNotifications: [],
      }));
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to mark all notifications as read';
      set({ error: errorMessage });
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  clearNotifications: () => set({ notifications: [], unreadNotifications: [], error: null }),

  setError: (error: string | null) => set({ error }),
}));

/**
 * Subscribe to real-time notification updates
 * Call this function trong component để subscribe
 */
export function subscribeToNotifications(workspaceId?: string) {
  const unsubscribe = websocketService.subscribe(
    workspaceId ? `private-workspace.${workspaceId}` : 'private-user',
    'notification.created',
    (data: any) => {
      const store = useNotificationStore.getState();
      const newNotification: Notification = {
        id: data.id || Date.now().toString(),
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      // Add to notifications list
      store.notifications = [newNotification, ...store.notifications].slice(0, 100); // Keep last 100
      
      // Add to unread if not read
      if (!newNotification.read_at) {
        store.unreadNotifications = [newNotification, ...store.unreadNotifications].slice(0, 50);
      }

      useNotificationStore.setState({
        notifications: store.notifications,
        unreadNotifications: store.unreadNotifications,
      });
    }
  );

  return unsubscribe;
}
