/**
 * Collection Workspace Permission Service
 * Service để tương tác với collection workspace permission endpoints
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface CollectionWorkspacePermission {
  user_id: string;
  permission: 'read' | 'write' | 'admin';
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CollectionWorkspacePermissions {
  collection_id: string;
  workspace_id: string;
  permissions: CollectionWorkspacePermission[];
}

/**
 * Lấy permissions của collection trong workspace
 */
export async function getCollectionWorkspacePermissions(
  collectionId: string,
  workspaceId: string
): Promise<CollectionWorkspacePermissions> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/workspaces/${workspaceId}/permissions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load collection workspace permissions');
  }

  return await response.json();
}

/**
 * Cập nhật permissions của collection trong workspace
 */
export async function updateCollectionWorkspacePermissions(
  collectionId: string,
  workspaceId: string,
  permissions: CollectionWorkspacePermission[]
): Promise<CollectionWorkspacePermissions> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/workspaces/${workspaceId}/permissions`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permissions }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to update collection workspace permissions');
  }

  return await response.json();
}

/**
 * Set permission cho user cụ thể trong collection workspace
 */
export async function setUserPermission(
  collectionId: string,
  workspaceId: string,
  userId: string,
  permission: 'read' | 'write' | 'admin'
): Promise<CollectionWorkspacePermission> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/workspaces/${workspaceId}/permissions/${userId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permission }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to set user permission');
  }

  return await response.json();
}

/**
 * Xóa permission của user trong collection workspace
 */
export async function removeUserPermission(
  collectionId: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/workspaces/${workspaceId}/permissions/${userId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to remove user permission');
  }
}
