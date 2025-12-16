/**
 * Presence Store
 * Quản lý online users và current activities trong workspace
 */

import { create } from 'zustand';

export interface OnlineUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  status?: 'online' | 'away' | 'offline';
  currentAction?: {
    type: 'viewing' | 'editing' | 'idle';
    entityType?: string;
    entityId?: string;
    entityName?: string;
  };
}

interface PresenceStore {
  onlineUsers: Map<string, OnlineUser>;
  currentActivities: Map<string, OnlineUser>;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addUser: (user: OnlineUser) => void;
  removeUser: (userId: string) => void;
  updateUserActivity: (userId: string, activity: OnlineUser['currentAction']) => void;
  getUsersByEntity: (entityType: string, entityId: string) => OnlineUser[];
  clear: () => void;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  onlineUsers: new Map(),
  currentActivities: new Map(),

  setOnlineUsers: (users) => {
    const usersMap = new Map<string, OnlineUser>();
    users.forEach((user) => {
      usersMap.set(user.id, { ...user, status: 'online' });
    });
    set({ onlineUsers: usersMap });
  },

  addUser: (user) => {
    set((state) => {
      const newUsers = new Map(state.onlineUsers);
      newUsers.set(user.id, { ...user, status: 'online' });
      return { onlineUsers: newUsers };
    });
  },

  removeUser: (userId) => {
    set((state) => {
      const newUsers = new Map(state.onlineUsers);
      const newActivities = new Map(state.currentActivities);
      newUsers.delete(userId);
      newActivities.delete(userId);
      return { onlineUsers: newUsers, currentActivities: newActivities };
    });
  },

  updateUserActivity: (userId, activity) => {
    set((state) => {
      const user = state.onlineUsers.get(userId);
      if (!user) return state;

      const updatedUser = { ...user, currentAction: activity };
      const newUsers = new Map(state.onlineUsers);
      newUsers.set(userId, updatedUser);

      const newActivities = new Map(state.currentActivities);
      if (activity && activity.type !== 'idle') {
        newActivities.set(userId, updatedUser);
      } else {
        newActivities.delete(userId);
      }

      return { onlineUsers: newUsers, currentActivities: newActivities };
    });
  },

  getUsersByEntity: (entityType, entityId) => {
    const state = get();
    const users: OnlineUser[] = [];
    
    state.currentActivities.forEach((user) => {
      if (
        user.currentAction?.entityType === entityType &&
        user.currentAction?.entityId === entityId
      ) {
        users.push(user);
      }
    });

    return users;
  },

  clear: () => {
    set({ onlineUsers: new Map(), currentActivities: new Map() });
  },
}));
