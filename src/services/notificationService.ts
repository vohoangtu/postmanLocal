/**
 * Notification Service
 * Service để tương tác với notifications API endpoints
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

/**
 * Lấy danh sách notifications
 */
export async function getNotifications(): Promise<Notification[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load notifications');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Lấy danh sách unread notifications
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/unread`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load unread notifications');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Đánh dấu notification là đã đọc
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to mark notification as read');
  }
}

/**
 * Đánh dấu tất cả notifications là đã đọc
 */
export async function markAllAsRead(): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to mark all notifications as read');
  }
}
