/**
 * Platform-aware storage service
 * Tự động chọn implementation phù hợp (Tauri hoặc Web)
 */

import { isTauri } from '../utils/platform';

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
 */
export async function saveRequest(
  request: RequestData,
  collectionId?: string,
  folderId?: string
): Promise<SavedRequest> {
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
      collectionId: collectionId ? parseInt(collectionId) : null,
      folderId: folderId ? parseInt(folderId) : null,
    });

    return {
      ...request,
      id: requestId.toString(),
      collectionId,
      folderId,
      createdAt: new Date().toISOString(),
    };
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

