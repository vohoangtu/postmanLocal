/**
 * Environment Service
 * Service để quản lý environments (user và workspace)
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  workspace_id?: string;
  user_id?: string;
}

/**
 * Lấy tất cả environments của user
 */
export async function getUserEnvironments(): Promise<Environment[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/environments`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Không thể lấy environments');
  }

  return response.json();
}

/**
 * Lấy environments của workspace
 */
export async function getWorkspaceEnvironments(workspaceId: string): Promise<Environment[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/environments`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Không thể lấy workspace environments');
  }

  return response.json();
}

/**
 * Tạo environment mới cho user
 */
export async function createUserEnvironment(data: {
  name: string;
  variables?: EnvironmentVariable[];
}): Promise<Environment> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/environments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      variables: data.variables ? JSON.stringify(data.variables) : null,
    }),
  });

  if (!response.ok) {
    throw new Error('Không thể tạo environment');
  }

  return response.json();
}

/**
 * Tạo environment mới cho workspace
 */
export async function createWorkspaceEnvironment(
  workspaceId: string,
  data: {
    name: string;
    variables?: EnvironmentVariable[];
  }
): Promise<Environment> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/environments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      variables: data.variables ? JSON.stringify(data.variables) : null,
    }),
  });

  if (!response.ok) {
    throw new Error('Không thể tạo workspace environment');
  }

  return response.json();
}

/**
 * Cập nhật environment
 */
export async function updateEnvironment(
  id: string,
  data: {
    name?: string;
    variables?: EnvironmentVariable[];
  }
): Promise<Environment> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      variables: data.variables ? JSON.stringify(data.variables) : null,
    }),
  });

  if (!response.ok) {
    throw new Error('Không thể cập nhật environment');
  }

  return response.json();
}

/**
 * Xóa environment
 */
export async function deleteEnvironment(id: string): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/environments/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Không thể xóa environment');
  }
}

/**
 * Sync environments với server
 */
export async function syncEnvironments(environments: Environment[]): Promise<Environment[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/environments/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      environments: environments.map((env) => ({
        id: env.id,
        name: env.name,
        variables: env.variables,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error('Không thể sync environments');
  }

  const result = await response.json();
  return result.environments;
}
