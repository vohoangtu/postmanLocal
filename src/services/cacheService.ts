/**
 * Cache Service - Quản lý caching cho responses và collections
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  totalEntries: number;
  memoryEntries: number;
  indexedDBEntries: number;
  totalSize: number; // Estimated size in bytes
  hitRate: number; // Cache hit rate (0-1)
  hits: number;
  misses: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private indexedDB: IDBDatabase | null = null;
  private dbName = "PostmanLocalCache";
  private dbVersion = 1;
  private maxMemorySize = 50 * 1024 * 1024; // 50MB max memory cache
  private maxIndexedDBSize = 100 * 1024 * 1024; // 100MB max IndexedDB cache
  private hits = 0;
  private misses = 0;
  private lastCleanup = Date.now();
  private cleanupInterval = 5 * 60 * 1000; // Cleanup every 5 minutes

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (typeof window === "undefined" || !window.indexedDB) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("responses")) {
          db.createObjectStore("responses", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "key" });
        }
      };
    });
  }

  /**
   * Get from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Periodic cleanup
    this.cleanupIfNeeded();

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      const age = Date.now() - memoryEntry.timestamp;
      if (age < memoryEntry.ttl) {
        this.hits++;
        return memoryEntry.data as T;
      } else {
        // Expired
        this.memoryCache.delete(key);
        this.misses++;
        // Also remove from IndexedDB
        await this.deleteFromIndexedDB(key);
        return null;
      }
    }

    // Check IndexedDB
    if (this.indexedDB) {
      try {
        const transaction = this.indexedDB.transaction(["responses", "collections"], "readonly");
        const stores = ["responses", "collections"];
        
        for (const storeName of stores) {
          const store = transaction.objectStore(storeName);
          const request = store.get(key);
          
          const entry = await new Promise<CacheEntry<T> | undefined>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          if (entry) {
            const age = Date.now() - entry.timestamp;
            if (age < entry.ttl) {
              // Also store in memory cache (if there's space)
              if (this.getMemoryCacheSize() < this.maxMemorySize) {
                this.memoryCache.set(key, entry);
              }
              this.hits++;
              return entry.data;
            } else {
              // Expired, remove from IndexedDB
              await this.deleteFromIndexedDB(key);
            }
          }
        }
      } catch (error) {
        console.error("IndexedDB get error:", error);
      }
    }

    this.misses++;
    return null;
  }

  /**
   * Delete from IndexedDB
   */
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.indexedDB) return;

    try {
      const stores = ["responses", "collections"];
      for (const storeName of stores) {
        const transaction = this.indexedDB.transaction([storeName], "readwrite");
        transaction.objectStore(storeName).delete(key);
      }
    } catch (error) {
      console.error("IndexedDB delete error:", error);
    }
  }

  /**
   * Get estimated memory cache size
   */
  private getMemoryCacheSize(): number {
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimate (2 bytes per char)
    }
    return size;
  }

  /**
   * Cleanup expired entries
   */
  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }
    this.lastCleanup = now;

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      const age = now - entry.timestamp;
      if (age >= entry.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup if memory cache is too large
    if (this.getMemoryCacheSize() > this.maxMemorySize) {
      this.evictOldestEntries();
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, timestamp: entry.timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i].key);
    }
  }

  /**
   * Set cache
   */
  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    // Cleanup before adding new entry
    this.cleanupIfNeeded();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Check memory cache size before adding
    const entrySize = JSON.stringify(entry).length * 2;
    if (this.getMemoryCacheSize() + entrySize > this.maxMemorySize) {
      this.evictOldestEntries();
    }

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in IndexedDB for persistence
    if (this.indexedDB) {
      try {
        const storeName = key.startsWith("response:") ? "responses" : "collections";
        const transaction = this.indexedDB.transaction([storeName], "readwrite");
        await new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(storeName).put({ key, ...entry });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error("IndexedDB set error:", error);
      }
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string | RegExp): Promise<void> {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate IndexedDB
    if (this.indexedDB) {
      try {
        const stores = ["responses", "collections"];
        for (const storeName of stores) {
          const transaction = this.indexedDB.transaction([storeName], "readwrite");
          const store = transaction.objectStore(storeName);
          const request = store.openCursor();

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              if (regex.test(cursor.key as string)) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        }
      } catch (error) {
        console.error("IndexedDB invalidate error:", error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const memoryEntries = this.memoryCache.size;
    let indexedDBEntries = 0;

    if (this.indexedDB) {
      try {
        const stores = ["responses", "collections"];
        for (const storeName of stores) {
          const transaction = this.indexedDB.transaction([storeName], "readonly");
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();
          indexedDBEntries += await new Promise<number>((resolve, reject) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
          });
        }
      } catch (error) {
        console.error("IndexedDB count error:", error);
      }
    }

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      totalEntries: memoryEntries + indexedDBEntries,
      memoryEntries,
      indexedDBEntries,
      totalSize: this.getMemoryCacheSize(),
      hitRate,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.deleteFromIndexedDB(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.indexedDB) {
      try {
        const stores = ["responses", "collections"];
        for (const storeName of stores) {
          const transaction = this.indexedDB!.transaction([storeName], "readwrite");
          transaction.objectStore(storeName).clear();
        }
      } catch (error) {
        console.error("IndexedDB clear error:", error);
      }
    }
  }

  /**
   * Generate cache key for request
   */
  generateRequestKey(method: string, url: string, body?: string): string {
    return `response:${method}:${url}:${body || ""}`;
  }

  /**
   * Generate cache key for collection
   */
  generateCollectionKey(collectionId: string): string {
    return `collection:${collectionId}`;
  }
}

export const cacheService = new CacheService();

// Initialize on load
if (typeof window !== "undefined") {
  cacheService.init().catch(console.error);
}


