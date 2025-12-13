import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  type: "collection" | "request" | "history" | "schema";
  title: string;
  subtitle?: string;
  data: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  collections?: any[];
  history?: any[];
  schemas?: any[];
}

export default function GlobalSearch({
  isOpen,
  onClose,
  onSelect,
  collections = [],
  history = [],
  schemas = [],
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search collections
    collections.forEach((collection) => {
      if (collection.name?.toLowerCase().includes(searchQuery)) {
        searchResults.push({
          id: collection.id,
          type: "collection",
          title: collection.name,
          subtitle: collection.description,
          data: collection,
        });
      }

      // Search requests in collection
      collection.requests?.forEach((request: any) => {
        if (
          request.name?.toLowerCase().includes(searchQuery) ||
          request.url?.toLowerCase().includes(searchQuery) ||
          request.method?.toLowerCase().includes(searchQuery)
        ) {
          searchResults.push({
            id: request.id || `${collection.id}-${request.name}`,
            type: "request",
            title: request.name || `${request.method} ${request.url}`,
            subtitle: `${collection.name} • ${request.method} ${request.url}`,
            data: request,
          });
        }
      });
    });

    // Search history
    history.forEach((item) => {
      if (
        item.url?.toLowerCase().includes(searchQuery) ||
        item.method?.toLowerCase().includes(searchQuery)
      ) {
        searchResults.push({
          id: item.id,
          type: "history",
          title: `${item.method} ${item.url}`,
          subtitle: new Date(item.timestamp).toLocaleString(),
          data: item,
        });
      }
    });

    // Search schemas
    schemas.forEach((schema) => {
      if (schema.name?.toLowerCase().includes(searchQuery)) {
        searchResults.push({
          id: schema.id,
          type: "schema",
          title: schema.name,
          subtitle: "API Schema",
          data: schema,
        });
      }
    });

    return searchResults.slice(0, 20); // Limit to 20 results
  }, [query, collections, history, schemas]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4"
        >
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search collections, requests, history..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {query ? "No results found" : "Start typing to search..."}
              </div>
            ) : (
              <div className="py-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onSelect(result);
                      onClose();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {result.subtitle}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

