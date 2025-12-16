/**
 * API Documentation Service
 * Generate và export API documentation
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface DocumentationPreview {
  format: 'markdown' | 'html' | 'openapi';
  content: string;
}

/**
 * Preview documentation cho collection
 */
export async function previewCollectionDocumentation(
  collectionId: string,
  format: 'markdown' | 'html' | 'openapi' = 'markdown'
): Promise<DocumentationPreview> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/documentation/preview?format=${format}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to preview documentation');
  }

  return await response.json();
}

/**
 * Download documentation cho collection
 */
export async function downloadCollectionDocumentation(
  collectionId: string,
  format: 'markdown' | 'html' | 'openapi' = 'markdown'
): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/collections/${collectionId}/documentation?format=${format}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to download documentation');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `documentation.${format === 'openapi' ? 'json' : format}`
    : `documentation.${format === 'openapi' ? 'json' : format}`;
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download documentation cho workspace
 */
export async function downloadWorkspaceDocumentation(
  workspaceId: string,
  format: 'markdown' | 'html' | 'openapi' = 'markdown'
): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/documentation?format=${format}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to download workspace documentation');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Get filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || `workspace-documentation.${format === 'openapi' ? 'json' : format}`
    : `workspace-documentation.${format === 'openapi' ? 'json' : format}`;
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
