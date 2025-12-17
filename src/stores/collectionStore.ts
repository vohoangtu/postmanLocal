import { create } from "zustand";
import { authService } from '../services/authService';
import { 
  updateRequestInCollection as updateRequestInCollectionBackend,
  removeRequestFromCollection as removeRequestFromCollectionBackend
} from '../services/collectionService';
import type { Collection, Request } from '../types/workspace';

// Re-export types for backward compatibility
export type { Collection, Request } from '../types/workspace';

interface CollectionStore {
  collections: Collection[];
  selectedCollection: string | null;
  defaultCollectionId: string | null;
  setCollections: (collections: Collection[]) => void;
  setSelectedCollection: (id: string | null) => void;
  setDefaultCollectionId: (id: string | null) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addRequestToCollection: (collectionId: string, request: Request) => void;
  updateRequestInCollection: (collectionId: string, requestId: string, updates: Partial<Request>) => void;
  deleteRequestFromCollection: (collectionId: string, requestId: string) => void;
  reloadTrigger: number; // Trigger để reload collections
  triggerReload: () => void; // Function để trigger reload
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  collections: [],
  selectedCollection: null,
  defaultCollectionId: null,
  reloadTrigger: 0,
  setCollections: (collections) => {
    // Tìm default collection khi set collections
    const defaultCollection = collections.find(c => c.is_default === true);
    set({ 
      collections,
      defaultCollectionId: defaultCollection?.id || null,
    });
  },
  setSelectedCollection: (id) => set({ selectedCollection: id }),
  setDefaultCollectionId: (id) => set({ defaultCollectionId: id }),
  addCollection: (collection) =>
    set((state) => ({ collections: [...state.collections, collection] })),
  updateCollection: (id, updates) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  deleteCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    })),
  addRequestToCollection: (collectionId, request) =>
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id === collectionId) {
          // Kiểm tra request đã tồn tại chưa (theo id)
          const existingIndex = c.requests.findIndex((r) => r.id === request.id);
          if (existingIndex >= 0) {
            // Update request hiện có
            const updatedRequests = [...c.requests];
            updatedRequests[existingIndex] = request;
            return { ...c, requests: updatedRequests };
          } else {
            // Thêm request mới
            return { ...c, requests: [...c.requests, request] };
          }
        }
        return c;
      }),
    })),
  updateRequestInCollection: async (collectionId, requestId, updates) => {
    // Update local store
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: c.requests.map((r) =>
                r.id === requestId ? { ...r, ...updates } : r
              ),
            }
          : c
      ),
    }));

    // Sync với backend nếu đã đăng nhập
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        await updateRequestInCollectionBackend(collectionId, requestId, updates);
        // Trigger reload để đảm bảo sync
        get().triggerReload();
      }
    } catch (error) {
      console.error('Failed to sync request update to backend:', error);
      // Không throw - đã update local store
    }
  },
  deleteRequestFromCollection: async (collectionId, requestId) => {
    // Update local store
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: c.requests.filter((r) => r.id !== requestId),
            }
          : c
      ),
    }));

    // Sync với backend nếu đã đăng nhập
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        await removeRequestFromCollectionBackend(collectionId, requestId);
        // Trigger reload để đảm bảo sync
        get().triggerReload();
      }
    } catch (error) {
      console.error('Failed to sync request deletion to backend:', error);
      // Không throw - đã update local store
    }
  },
  triggerReload: () => set((state) => ({ reloadTrigger: state.reloadTrigger + 1 })),
}));


