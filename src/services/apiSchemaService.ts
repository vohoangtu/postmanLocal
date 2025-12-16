/**
 * API Schema Service
 * Service để tương tác với API schema endpoints
 */

import { authService } from './authService';
import { ApiSchema, OpenAPISchema, SchemaValidationError } from '../stores/apiSchemaStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Lấy danh sách schemas trong workspace
 */
export async function getWorkspaceSchemas(workspaceId: string): Promise<ApiSchema[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/schemas`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load schemas');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Tạo schema mới trong workspace
 */
export async function createWorkspaceSchema(
  workspaceId: string,
  name: string,
  schemaData: OpenAPISchema
): Promise<ApiSchema> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/schemas`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        schema_data: schemaData,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to create schema');
  }

  return await response.json();
}

/**
 * Cập nhật schema
 */
export async function updateSchema(
  schemaId: string,
  updates: { name?: string; schema_data?: OpenAPISchema }
): Promise<ApiSchema> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/schemas/${schemaId}`,
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
    throw new Error(error.message || 'Failed to update schema');
  }

  return await response.json();
}

/**
 * Xóa schema
 */
export async function deleteSchema(schemaId: string): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/schemas/${schemaId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to delete schema');
  }
}

/**
 * Validate schema
 */
export async function validateSchema(
  schemaId: string,
  schemaData?: OpenAPISchema
): Promise<{ valid: boolean; errors: SchemaValidationError[] }> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const body: any = {};
  if (schemaData) {
    body.schema_data = schemaData;
  }

  const response = await fetch(
    `${API_BASE_URL}/schemas/${schemaId}/validate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to validate schema');
  }

  return await response.json();
}

/**
 * Import schema từ collection
 */
export async function importSchemaFromCollection(
  schemaId: string,
  collectionId: string
): Promise<ApiSchema> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(
    `${API_BASE_URL}/schemas/${schemaId}/import-from-collection`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection_id: collectionId }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to import schema from collection');
  }

  return await response.json();
}
