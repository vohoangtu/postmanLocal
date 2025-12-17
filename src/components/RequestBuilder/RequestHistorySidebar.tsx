/**
 * Request History Sidebar Component
 * Sidebar hiển thị request history trong Request Builder
 */

import { useState, useMemo, useCallback } from 'react';
import { History, Search, X, Clock } from 'lucide-react';
import { useRequestHistoryStore, RequestHistoryItem } from '../../stores/requestHistoryStore';
import { useDebounce } from '../../hooks/useDebounce';
import Button from '../UI/Button';
import Input from '../UI/Input';
import EmptyState from '../EmptyStates/EmptyState';

export interface RequestHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRequest: (item: RequestHistoryItem) => void;
}

export default function RequestHistorySidebar({
  isOpen,
  onClose,
  onSelectRequest,
}: RequestHistorySidebarProps) {
  const { history, clearHistory, removeFromHistory } = useRequestHistoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredHistory = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return history;
    
    const query = debouncedSearchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.url.toLowerCase().includes(query) ||
        item.method.toLowerCase().includes(query) ||
        (item.statusText && item.statusText.toLowerCase().includes(query))
    );
  }, [history, debouncedSearchQuery]);

  const handleSelect = useCallback((item: RequestHistoryItem) => {
    onSelectRequest(item);
  }, [onSelectRequest]);

  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromHistory(id);
  }, [removeFromHistory]);

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 400) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'POST':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={18} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Request History
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Tìm kiếm trong history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Actions */}
      {history.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="w-full text-sm"
          >
            Xóa tất cả history
          </Button>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={searchQuery ? Search : History}
              title={searchQuery ? "Không tìm thấy kết quả" : "Chưa có history"}
              description={
                searchQuery
                  ? "Thử điều chỉnh từ khóa tìm kiếm"
                  : "Lịch sử request sẽ xuất hiện ở đây sau khi bạn gửi request"
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded flex-shrink-0 ${getMethodColor(item.method)}`}
                    >
                      {item.method}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                      {item.url}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex-shrink-0"
                    aria-label="Xóa khỏi history"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {item.status && (
                    <span className={getStatusColor(item.status)}>
                      {item.status} {item.statusText}
                    </span>
                  )}
                  {item.duration && (
                    <span>{item.duration}ms</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
