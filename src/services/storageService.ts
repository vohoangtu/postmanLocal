/**
 * Platform-aware storage service
 * Tự động chọn implementation phù hợp (Tauri hoặc Web)
 */

import { isTauri } from '../utils/platform';
import { authService } from './authService';
import { addRequestToCollection as addRequestToCollectionBackend } from './collectionService';

export interface RequestData {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
}

export interface SavedRequest extends RequestData {
  id: string;
  collectionId?: string;
  folderId?: string;
  createdAt?: string;
}

/**
 * Lưu request vào storage
 * collectionId là bắt buộc - request phải thuộc một collection
 */
export async function saveRequest(
  request: RequestData,
  collectionId: string,
  folderId?: string
): Promise<SavedRequest> {
  // Validation: collectionId là bắt buộc
  if (!collectionId) {
    throw new Error('Collection ID là bắt buộc. Request phải thuộc một collection.');
  }
  if (isTauri()) {
    // Sử dụng Tauri invoke cho desktop
    const { invoke } = await import('@tauri-apps/api/core');
    
    const headersJson = JSON.stringify(request.headers);
    const queryParamsJson = request.queryParams ? JSON.stringify(request.queryParams) : null;
    
    const requestId = await invoke<number>('save_request_to_collection', {
      name: request.name,
      method: request.method,
      url: request.url,
      headers: headersJson,
      body: request.body || null,
      queryParams: queryParamsJson,
      collectionId: parseInt(collectionId),
      folderId: folderId ? parseInt(folderId) : null,
    });

    const savedRequest: SavedRequest = {
      ...request,
      id: requestId.toString(),
      collectionId,
      folderId,
      createdAt: new Date().toISOString(),
    };

    // Sync với backend nếu đã đăng nhập
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        // Sync request với backend
        await addRequestToCollectionBackend(collectionId, {
          id: savedRequest.id,
          name: savedRequest.name,
          method: savedRequest.method,
          url: savedRequest.url,
          headers: savedRequest.headers || {},
          body: savedRequest.body,
          queryParams: savedRequest.queryParams,
          folderId: savedRequest.folderId,
        });
      }
    } catch (error) {
      // Log error nhưng không throw - request đã được lưu local
      console.error('Failed to sync request to backend:', error);
    }

    return savedRequest;
  } else {
    // Sử dụng localStorage cho web
    const savedRequests = getSavedRequests();
    const newRequest: SavedRequest = {
      ...request,
      id: Date.now().toString(),
      collectionId,
      folderId,
      createdAt: new Date().toISOString(),
    };
    
    savedRequests.push(newRequest);
    localStorage.setItem('postmanlocal_requests', JSON.stringify(savedRequests));
    
    // Sync với backend nếu đã đăng nhập
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        // Sync request với backend
        await addRequestToCollectionBackend(collectionId, {
          id: newRequest.id,
          name: newRequest.name,
          method: newRequest.method,
          url: newRequest.url,
          headers: newRequest.headers || {},
          body: newRequest.body,
          queryParams: newRequest.queryParams,
          folderId: newRequest.folderId,
        });
      }
    } catch (error) {
      // Log error nhưng không throw - request đã được lưu local
      console.error('Failed to sync request to backend:', error);
    }
    
    return newRequest;
  }
}

/**
 * Load collections từ storage
 */
export async function loadCollections(): Promise<any[]> {
  if (isTauri()) {
    // Sử dụng Tauri invoke
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('load_collections');
  } else {
    // Sử dụng localStorage cho web
    const collectionsJson = localStorage.getItem('postmanlocal_collections');
    return collectionsJson ? JSON.parse(collectionsJson) : [];
  }
}

/**
 * Load requests từ collection
 */
export async function loadRequestsFromCollection(collectionId: string): Promise<SavedRequest[]> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('load_requests_from_collection', { collectionId });
  } else {
    const savedRequests = getSavedRequests();
    return savedRequests.filter(r => r.collectionId === collectionId);
  }
}

/**
 * Helper function để lấy saved requests từ localStorage (web only)
 */
function getSavedRequests(): SavedRequest[] {
  if (typeof window === 'undefined') return [];
  const requestsJson = localStorage.getItem('postmanlocal_requests');
  return requestsJson ? JSON.parse(requestsJson) : [];
}

/**
 * Save collection (web only - Tauri dùng sync service)
 */
export async function saveCollection(collection: any): Promise<void> {
  if (isTauri()) {
    // Tauri sẽ dùng sync service riêng
    return;
  }
  
  const collections = await loadCollections();
  const existingIndex = collections.findIndex(c => c.id === collection.id);
  
  if (existingIndex >= 0) {
    collections[existingIndex] = collection;
  } else {
    collections.push(collection);
  }
  
  localStorage.setItem('postmanlocal_collections', JSON.stringify(collections));
}

