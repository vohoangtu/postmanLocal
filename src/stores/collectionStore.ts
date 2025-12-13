import { create } from "zustand";

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

interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: Request[];
  is_shared?: boolean;
  permission?: "read" | "write" | "admin";
  workspace_id?: string;
}

interface CollectionStore {
  collections: Collection[];
  selectedCollection: string | null;
  setCollections: (collections: Collection[]) => void;
  setSelectedCollection: (id: string | null) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addRequestToCollection: (collectionId: string, request: Request) => void;
  updateRequestInCollection: (collectionId: string, requestId: string, updates: Partial<Request>) => void;
  deleteRequestFromCollection: (collectionId: string, requestId: string) => void;
}

export const useCollectionStore = create<CollectionStore>((set) => ({
  collections: [],
  selectedCollection: null,
  setCollections: (collections) => set({ collections }),
  setSelectedCollection: (id) => set({ selectedCollection: id }),
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
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: [...c.requests, request] }
          : c
      ),
    })),
  updateRequestInCollection: (collectionId, requestId, updates) =>
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
    })),
  deleteRequestFromCollection: (collectionId, requestId) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: c.requests.filter((r) => r.id !== requestId),
            }
          : c
      ),
    })),
}));


