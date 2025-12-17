/**
 * Workspace Service
 * Service để tương tác với workspace API endpoints
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description?: string;
  collection_id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Lấy danh sách templates trong workspace
 */
export async function getWorkspaceTemplates(workspaceId: string): Promise<WorkspaceTemplate[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load workspace templates');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Handle API errors một cách nhất quán
 */
export function handleApiError(error: any): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (error?.message) {
    return new Error(error.message);
  }
  
  return new Error('Đã xảy ra lỗi không xác định');
}
