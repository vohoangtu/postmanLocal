/**
 * Collection Card Component
 * Component card để hiển thị collection với icon, name, badges và hover effects
 */

import { memo } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import CollectionPermissionBadge from './CollectionPermissionBadge';
import { cn } from '../../utils/cn';

export interface CollectionCardProps {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isShared?: boolean;
  permission?: 'read' | 'write' | 'admin';
  requestCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

function CollectionCard({
  id,
  name,
  description,
  isDefault = false,
  isShared = false,
  permission,
  requestCount = 0,
  isSelected = false,
  onClick,
  className,
}: CollectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative',
        'bg-white dark:bg-gray-800',
        'border-2 rounded-lg',
        'p-4',
        'cursor-pointer',
        'transition-all duration-200',
        'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600',
        isSelected
          ? 'border-blue-500 dark:border-blue-400 shadow-md bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        className
      )}
    >
      {/* Icon và Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'flex-shrink-0',
          'w-10 h-10',
          'rounded-lg',
          'flex items-center justify-center',
          'transition-colors',
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
        )}>
          {isSelected ? (
            <FolderOpen size={20} />
          ) : (
            <Folder size={20} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              'text-base font-semibold',
              'text-gray-900 dark:text-white',
              'truncate',
              isSelected && 'text-blue-900 dark:text-blue-100'
            )}>
              {name || 'Unnamed Collection'}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {isDefault && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-md border border-blue-300 dark:border-blue-700">
                Default
              </span>
            )}
            <CollectionPermissionBadge
              isShared={isShared}
              permission={permission}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className={cn(
          'text-sm text-gray-600 dark:text-gray-400',
          'line-clamp-2',
          'mb-3'
        )}>
          {description}
        </p>
      )}

      {/* Footer với request count */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {requestCount} {requestCount === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {/* Hover indicator */}
      <div className={cn(
        'absolute inset-0 rounded-lg',
        'pointer-events-none',
        'transition-opacity duration-200',
        'opacity-0 group-hover:opacity-100',
        'bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10',
        isSelected && 'opacity-100'
      )} />
    </div>
  );
}

export default memo(CollectionCard);
