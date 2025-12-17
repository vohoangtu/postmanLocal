/**
 * History Card Component
 * Component card để hiển thị request history item với method badge, URL, status và timestamp
 */

import { memo, useCallback } from 'react';
import { Clock, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { RequestHistoryItem } from '../../stores/requestHistoryStore';

export interface HistoryCardProps {
  item: RequestHistoryItem;
  onOpen?: (item: RequestHistoryItem) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusColors: Record<number, string> = {
  200: 'text-green-600 dark:text-green-400',
  201: 'text-green-600 dark:text-green-400',
  204: 'text-green-600 dark:text-green-400',
  400: 'text-yellow-600 dark:text-yellow-400',
  401: 'text-yellow-600 dark:text-yellow-400',
  403: 'text-yellow-600 dark:text-yellow-400',
  404: 'text-red-600 dark:text-red-400',
  500: 'text-red-600 dark:text-red-400',
};

function HistoryCard({
  item,
  onOpen,
  onRemove,
  className,
}: HistoryCardProps) {
  const methodColor = methodColors[item.method] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const statusColor = item.status ? (statusColors[item.status] || 'text-gray-600 dark:text-gray-400') : '';

  const handleClick = useCallback(() => {
    onOpen?.(item);
  }, [item, onOpen]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(item.id);
  }, [item.id, onRemove]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative',
        'bg-white dark:bg-gray-800',
        'border rounded-lg',
        'p-3',
        'cursor-pointer',
        'transition-all duration-200',
        'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600',
        'border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header với Method và URL */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn(
            'px-2 py-0.5 text-xs font-semibold rounded font-mono flex-shrink-0',
            methodColor
          )}>
            {item.method}
          </span>
          <span className={cn(
            'text-sm text-gray-900 dark:text-white',
            'truncate font-mono'
          )}>
            {item.url}
          </span>
        </div>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={handleRemove}
            className={cn(
              'opacity-0 group-hover:opacity-100',
              'p-1 rounded transition-opacity',
              'text-red-600 dark:text-red-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              'flex-shrink-0'
            )}
            aria-label="Remove from history"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Footer với Status, Duration và Timestamp */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {item.status && (
          <span className={cn('font-medium', statusColor)}>
            {item.status}
          </span>
        )}
        {item.duration !== undefined && (
          <span>{item.duration}ms</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Clock size={12} />
          <span>{formatTime(item.timestamp)}</span>
        </div>
      </div>

      {/* Hover indicator */}
      <div className={cn(
        'absolute inset-0 rounded-lg',
        'pointer-events-none',
        'transition-opacity duration-200',
        'opacity-0 group-hover:opacity-100',
        'bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10'
      )} />
    </div>
  );
}

export default memo(HistoryCard);
