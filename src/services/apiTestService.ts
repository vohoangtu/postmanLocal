/**
 * API Test Service
 * Service để tương tác với API test endpoints
 */

import { authService } from './authService';
import { ApiTestSuite } from '../stores/apiTestStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function getWorkspaceTestSuites(workspaceId: string): Promise<ApiTestSuite[]> {
  const token = await authService.getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập');

  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/test-suites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load test suites');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

export async function createTestSuite(
  workspaceId: string,
  data: {
    name: string;
    description?: string;
    schema_id?: string;
    test_config: any;
  }
): Promise<ApiTestSuite> {
  const token = await authService.getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập');

  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/test-suites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to create test suite');
  }

  return await response.json();
}

export async function runTestSuite(suiteId: string): Promise<ApiTestSuite> {
  const token = await authService.getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập');

  const response = await fetch(`${API_BASE_URL}/test-suites/${suiteId}/run`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to run test suite');
  }

  return await response.json();
}

export async function runContractTest(
  suiteId: string,
  baseUrl: string
): Promise<ApiTestSuite> {
  const token = await authService.getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập');

  const response = await fetch(`${API_BASE_URL}/test-suites/${suiteId}/contract-test`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base_url: baseUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to run contract test');
  }

  return await response.json();
}
