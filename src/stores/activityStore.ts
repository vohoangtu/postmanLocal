import { create } from "zustand";
import * as activityService from "../services/activityService";
import { websocketService } from "../services/websocketService";
import type { ActivityLog } from "../types/workspace";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

interface ActivityStore {
  activities: ActivityLog[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  setActivities: (activities: ActivityLog[]) => void;
  addActivity: (activity: ActivityLog) => void;
  loadActivities: (filters?: activityService.ActivityFilters) => Promise<void>;
  loadCollectionActivities: (collectionId: string, filters?: Omit<activityService.ActivityFilters, 'collection_id'>) => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateUnreadCount: (count: number) => void;
  setError: (error: string | null) => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  activities: [],
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  setActivities: (activities) => set({ activities }),

  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 100), // Keep last 100
    })),

  loadActivities: async (filters) => {
    set({ loading: true, error: null });
    try {
      const activities = await activityService.getActivities(filters);
      set({ activities, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load activities';
      set({ error: errorMessage, loading: false });
      console.error('Failed to load activities:', error);
    }
  },

  loadCollectionActivities: async (collectionId, filters) => {
    set({ loading: true, error: null });
    try {
      const activities = await activityService.getCollectionActivities(collectionId, filters);
      set({ activities, loading: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load collection activities';
      set({ error: errorMessage, loading: false });
      console.error('Failed to load collection activities:', error);
    }
  },

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read_at).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
      unreadCount: 0,
    })),

  updateUnreadCount: (count) => set({ unreadCount: count }),

  setError: (error: string | null) => set({ error }),
}));

/**
 * Subscribe to real-time activity updates
 * Call this function trong component để subscribe
 */
export function subscribeToActivities(collectionId?: string) {
  const channelName = collectionId ? `private-collection.${collectionId}` : 'private-user';
  
  const unsubscribe = websocketService.subscribe(
    channelName,
    'activity.real-time',
    (data: any) => {
      const store = useActivityStore.getState();
      const activity: ActivityLog = {
        id: data.id || Date.now().toString(),
        collection_id: data.collection_id || collectionId,
        user_id: data.user_id,
        action: data.action,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        metadata: data.metadata || { name: data.entity_name },
        created_at: data.created_at || new Date().toISOString(),
        user: data.user,
      };
      
      store.addActivity(activity);
    }
  );

  return unsubscribe;
}





