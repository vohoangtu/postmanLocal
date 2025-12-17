/**
 * Collection Service
 * Quản lý collection operations với backend API
 */

import apiClient from './apiClient';
import type { Collection, Request, CreateCollectionFormData } from '../types/workspace';

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

// Re-export types from workspace types
export type { Request, Collection, CreateCollectionFormData } from '../types/workspace';

/**
 * Lấy collection từ backend
 */
export async function getCollection(collectionId: string): Promise<Collection> {
  try {
    return await apiClient.get<Collection>(`/collections/${collectionId}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('hết hạn')) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (error.message.includes('404') || error.message.includes('không tồn tại')) {
        throw new Error('Collection không tồn tại.');
      }
    }
    throw error;
  }
}

/**
 * Update collection requests trong backend
 */
export async function updateCollectionRequests(
  collectionId: string,
  requests: Request[]
): Promise<Collection> {
  // Lấy collection hiện tại
  const collection = await getCollection(collectionId);

  // Parse collection.data
  const currentData = parseCollectionData(collection.data);

  // Update collection data với requests mới
  const updatedData = {
    ...currentData,
    requests: requests,
  };

  console.log('Updating collection requests:', {
    collectionId,
    currentRequestsCount: currentData?.requests?.length || 0,
    newRequestsCount: requests.length,
  });

  try {
    return await apiClient.put<Collection>(`/collections/${collectionId}`, {
      data: updatedData,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('hết hạn')) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (error.message.includes('404') || error.message.includes('không tồn tại')) {
        throw new Error('Collection không tồn tại.');
      }
    }
    throw error;
  }
}

/**
 * Thêm request vào collection trong backend
 */
export async function addRequestToCollection(
  collectionId: string,
  request: Request
): Promise<Collection> {
  try {
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
    const result = await updateCollectionRequests(collectionId, updatedRequests);
    console.log('Request added to collection successfully:', { collectionId, requestId: request.id, totalRequests: updatedRequests.length });
    return result;
  } catch (error) {
    console.error('Error adding request to collection:', error);
    throw error;
  }
}

/**
 * Xóa request khỏi collection trong backend
 */
export async function removeRequestFromCollection(
  collectionId: string,
  requestId: string
): Promise<Collection> {
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
): Promise<Collection> {
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
export async function getDefaultCollection(): Promise<Collection> {
  try {
    return await apiClient.get<Collection>('/collections/default');
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('hết hạn')) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (error.message.includes('404') || error.message.includes('không tồn tại')) {
        throw new Error('Chưa có default collection. Vui lòng tạo collection mới.');
      }
    }
    throw error;
  }
}

/**
 * Set collection làm default
 */
export async function setDefaultCollection(collectionId: string): Promise<Collection> {
  try {
    return await apiClient.post<Collection>(`/collections/${collectionId}/set-default`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('hết hạn')) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (error.message.includes('404') || error.message.includes('không tồn tại')) {
        throw new Error('Collection không tồn tại.');
      }
    }
    throw error;
  }
}

/**
 * Lấy danh sách collections của user (không còn workspace)
 */
export async function getCollections(): Promise<Collection[]> {
  try {
    return await apiClient.get<Collection[]>('/collections');
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Không thể tải collections: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Tạo collection mới (user-owned)
 */
export async function createCollection(data: CreateCollectionFormData): Promise<Collection> {
  try {
    return await apiClient.post<Collection>('/collections', {
      name: data.name,
      description: data.description,
      data: { requests: [] },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Không thể tạo collection: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Xóa collection
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    await apiClient.delete(`/collections/${collectionId}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        throw new Error('Collection không tồn tại.');
      }
      throw new Error(`Không thể xóa collection: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Cập nhật collection
 */
export async function updateCollection(
  collectionId: string,
  updates: Partial<Collection>
): Promise<Collection> {
  try {
    return await apiClient.put<Collection>(`/collections/${collectionId}`, updates);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        throw new Error('Collection không tồn tại.');
      }
      throw new Error(`Không thể cập nhật collection: ${error.message}`);
    }
    throw error;
  }
}
