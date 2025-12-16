/**
 * Collection Service
 * Quản lý collection operations với backend API
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Helper function để parse collection.data từ nhiều format khác nhau
 */
function parseCollectionData(data: any): any {
  if (!data) return {};
  
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing collection data:', e);
      return {};
    }
  }
  
  if (typeof data === 'object') {
    return data;
  }
  
  return {};
}

export interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
  folderId?: string;
}

/**
 * Lấy collection từ backend
 */
export async function getCollection(collectionId: string): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 404) {
      throw new Error('Collection không tồn tại.');
    }
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to get collection: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update collection requests trong backend
 */
export async function updateCollectionRequests(
  collectionId: string,
  requests: Request[]
): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  // Lấy collection hiện tại
  const collection = await getCollection(collectionId);

  // Parse collection.data
  const currentData = parseCollectionData(collection.data);

  // Update collection data với requests mới
  const updatedData = {
    ...currentData,
    requests: requests,
  };

  const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: updatedData,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 404) {
      throw new Error('Collection không tồn tại.');
    }
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to update collection: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Thêm request vào collection trong backend
 */
export async function addRequestToCollection(
  collectionId: string,
  request: Request
): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  // Lấy collection hiện tại
  const collection = await getCollection(collectionId);

  // Parse collection.data
  const currentData = parseCollectionData(collection.data);

  // Lấy requests hiện tại từ collection.data
  const currentRequests: Request[] = currentData?.requests || [];

  // Kiểm tra request đã tồn tại chưa (theo id)
  const existingIndex = currentRequests.findIndex((r: Request) => r.id === request.id);
  let updatedRequests: Request[];

  if (existingIndex >= 0) {
    // Update request hiện có
    updatedRequests = [...currentRequests];
    updatedRequests[existingIndex] = request;
  } else {
    // Thêm request mới
    updatedRequests = [...currentRequests, request];
  }

  // Update collection với requests mới
  return await updateCollectionRequests(collectionId, updatedRequests);
}

/**
 * Xóa request khỏi collection trong backend
 */
export async function removeRequestFromCollection(
  collectionId: string,
  requestId: string
): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  // Lấy collection hiện tại
  const collection = await getCollection(collectionId);

  // Parse collection.data
  const currentData = parseCollectionData(collection.data);

  // Lấy requests hiện tại từ collection.data
  const currentRequests: Request[] = currentData?.requests || [];

  // Xóa request
  const updatedRequests = currentRequests.filter((r: Request) => r.id !== requestId);

  // Update collection với requests mới
  return await updateCollectionRequests(collectionId, updatedRequests);
}

/**
 * Update request trong collection trong backend
 */
export async function updateRequestInCollection(
  collectionId: string,
  requestId: string,
  updates: Partial<Request>
): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  // Lấy collection hiện tại
  const collection = await getCollection(collectionId);

  // Parse collection.data
  const currentData = parseCollectionData(collection.data);

  // Lấy requests hiện tại từ collection.data
  const currentRequests: Request[] = currentData?.requests || [];

  // Tìm và update request
  const updatedRequests = currentRequests.map((r: Request) =>
    r.id === requestId ? { ...r, ...updates } : r
  );

  // Update collection với requests mới
  return await updateCollectionRequests(collectionId, updatedRequests);
}

/**
 * Lấy default collection của user hiện tại
 */
export async function getDefaultCollection(): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/collections/default`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 404) {
      throw new Error('Chưa có default collection. Vui lòng tạo collection mới.');
    }
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to get default collection: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Set collection làm default
 */
export async function setDefaultCollection(collectionId: string): Promise<any> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/set-default`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (response.status === 404) {
      throw new Error('Collection không tồn tại.');
    }
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Failed to set default collection: ${response.statusText}`);
  }

  return await response.json();
}
