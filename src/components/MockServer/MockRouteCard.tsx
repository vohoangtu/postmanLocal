/**
 * Mock Route Card Component
 * Component card để hiển thị mock route với method badge, path, status và actions
 */

import { memo } from 'react';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';
import Button from '../UI/Button';
import { cn } from '../../utils/cn';
import { MockRoute } from '../../services/mockServerService';

export interface MockRouteCardProps {
  route: MockRoute;
  index: number;
  onEdit?: (route: MockRoute) => void;
  onDelete?: (index: number) => void;
  onToggle?: (index: number) => void;
  isEnabled?: boolean;
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

function MockRouteCard({
  route,
  index,
  onEdit,
  onDelete,
  onToggle,
  isEnabled = true,
  className,
}: MockRouteCardProps) {
  const methodColor = methodColors[route.method] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  const statusColor = statusColors[route.status] || 'text-gray-600 dark:text-gray-400';

  return (
    <div
      className={cn(
        'group relative',
        'bg-white dark:bg-gray-800',
        'border-2 rounded-lg',
        'p-4',
        'transition-all duration-200',
        'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600',
        !isEnabled && 'opacity-60',
        'border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header với Method và Path */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'px-2 py-0.5 text-xs font-semibold rounded font-mono',
              methodColor
            )}>
              {route.method}
            </span>
            <span className={cn(
              'text-sm font-medium text-gray-900 dark:text-white',
              'font-mono truncate'
            )}>
              {route.path}
            </span>
          </div>

          {/* Status và Delay */}
          <div className="flex items-center gap-3 text-xs">
            <span className={cn('font-medium', statusColor)}>
              Status: {route.status}
            </span>
            {route.delayMs !== undefined && route.delayMs > 0 && (
              <span className="text-gray-500 dark:text-gray-400">
                Delay: {route.delayMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Toggle button */}
        {onToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(index);
            }}
            className={cn(
              'p-1.5 rounded transition-colors',
              isEnabled
                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
            title={isEnabled ? 'Disable route' : 'Enable route'}
          >
            {isEnabled ? <Power size={16} /> : <PowerOff size={16} />}
          </button>
        )}
      </div>

      {/* Body Preview */}
      {route.body && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-hidden">
          <div className="truncate">
            {typeof route.body === 'string' 
              ? route.body 
              : JSON.stringify(route.body).substring(0, 100)}
            {typeof route.body !== 'string' && JSON.stringify(route.body).length > 100 && '...'}
          </div>
        </div>
      )}

      {/* Footer với actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(route);
            }}
            className="flex items-center gap-1"
          >
            <Edit size={14} />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        )}
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

export default memo(MockRouteCard);
