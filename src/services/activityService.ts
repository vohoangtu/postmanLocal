/**
 * Activity Service
 * Service để tương tác với activity logs API endpoints
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface ActivityLog {
  id: string;
  workspace_id?: string;
  collection_id?: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ActivityFilters {
  workspace_id?: string;
  collection_id?: string;
  user_id?: string;
  action?: string;
  entity_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Lấy danh sách activities với filters
 */
export async function getActivities(filters?: ActivityFilters): Promise<ActivityLog[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  const url = `${API_BASE_URL}/activities${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load activities');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Lấy danh sách activities trong workspace
 */
export async function getWorkspaceActivities(workspaceId: string, filters?: Omit<ActivityFilters, 'workspace_id'>): Promise<ActivityLog[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  const url = `${API_BASE_URL}/workspaces/${workspaceId}/activities${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load workspace activities');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Lấy danh sách activities trong collection
 */
export async function getCollectionActivities(collectionId: string, filters?: Omit<ActivityFilters, 'collection_id'>): Promise<ActivityLog[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  const url = `${API_BASE_URL}/collections/${collectionId}/activities${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load collection activities');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}
