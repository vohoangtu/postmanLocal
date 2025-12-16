/**
 * API Version Service
 * Service để tương tác với API version endpoints
 */

import { authService } from './authService';
import { ApiVersion, VersionDiff } from '../stores/apiVersionStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Lấy danh sách versions cho schema
 */
export async function getSchemaVersions(schemaId: string): Promise<ApiVersion[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/schemas/${schemaId}/versions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load versions');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Tạo version mới
 */
export async function createVersion(
  schemaId: string,
  data: {
    version_name?: string;
    changelog?: string;
    is_current?: boolean;
  }
): Promise<ApiVersion> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/schemas/${schemaId}/versions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to create version');
  }

  return await response.json();
}

/**
 * Lấy diff giữa version và version trước
 */
export async function getVersionDiff(versionId: string): Promise<{
  current: any;
  previous: any;
  diff: VersionDiff[];
}> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/versions/${versionId}/diff`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to get version diff');
  }

  return await response.json();
}

/**
 * Set version làm current
 */
export async function setCurrentVersion(versionId: string): Promise<ApiVersion> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/versions/${versionId}/set-current`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to set current version');
  }

  return await response.json();
}
