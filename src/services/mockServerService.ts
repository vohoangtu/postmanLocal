/**
 * Mock Server Service
 * Service để tương tác với mock server endpoints
 */

import { authService } from './authService';
import { MockServer, MockRoute as StoreMockRoute } from '../stores/mockServerStore';

// MockRoute type cho MockServerPanel (web mock server)
export interface MockRoute {
  path: string;
  method: string;
  status: number;
  headers: { [key: string]: string };
  body: any;
  delayMs?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Lấy danh sách mock servers trong workspace
 */
export async function getWorkspaceMockServers(workspaceId: string): Promise<MockServer[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/mock-servers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load mock servers');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Tạo mock server mới
 */
export async function createMockServer(
  workspaceId: string,
  data: {
    name: string;
    schema_id?: string;
    base_url?: string;
    port?: number;
    config?: any;
  }
): Promise<MockServer> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/mock-servers`,
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
    throw new Error(error.message || 'Failed to create mock server');
  }

  return await response.json();
}

/**
 * Cập nhật mock server
 */
export async function updateMockServer(
  serverId: string,
  updates: Partial<MockServer>
): Promise<MockServer> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/mock-servers/${serverId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to update mock server');
  }

  return await response.json();
}

/**
 * Xóa mock server
 */
export async function deleteMockServer(serverId: string): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/mock-servers/${serverId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to delete mock server');
  }
}

/**
 * Start mock server
 */
export async function startMockServer(serverId: string): Promise<MockServer> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/mock-servers/${serverId}/start`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to start mock server');
  }

  const data = await response.json();
  return data.mock_server || data;
}

/**
 * Stop mock server
 */
export async function stopMockServer(serverId: string): Promise<MockServer> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/mock-servers/${serverId}/stop`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to stop mock server');
  }

  const data = await response.json();
  return data.mock_server || data;
}

/**
 * Lấy routes của mock server
 */
export async function getMockServerRoutes(serverId: string): Promise<StoreMockRoute[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/mock-servers/${serverId}/routes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load routes');
  }

  const data = await response.json();
  return data.routes || [];
}
