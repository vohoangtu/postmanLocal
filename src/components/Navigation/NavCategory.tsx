/**
 * Navigation Category Component
 * Component cho navigation categories với expand/collapse functionality
 * Sử dụng trong cả GlobalNavBar và WorkspaceLayout
 */

import { memo, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface NavCategoryProps {
  id: string;
  label: string;
  items: ReactNode[];
  isExpanded?: boolean;
  onToggle?: () => void;
  hasActiveItem?: boolean;
  teamOnly?: boolean;
  className?: string;
}

function NavCategory({
  id,
  label,
  items,
  isExpanded = false,
  onToggle,
  hasActiveItem = false,
  className,
}: NavCategoryProps) {
  const canExpand = items.length > 1;
  const shouldShowItems = !items.length || items.length === 1 || isExpanded;

  return (
    <div className={cn('mb-2', className)}>
      {/* Category Header */}
      {canExpand ? (
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
            hasActiveItem
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}
          aria-expanded={isExpanded}
          aria-controls={`nav-category-${id}`}
        >
          <span>{label}</span>
          {isExpanded ? (
            <ChevronDown size={14} aria-hidden="true" />
          ) : (
            <ChevronRight size={14} aria-hidden="true" />
          )}
        </button>
      ) : (
        <div className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </div>
      )}

      {/* Category Items */}
      {shouldShowItems && (
        <div 
          id={`nav-category-${id}`}
          className="space-y-0.5"
          role="group"
          aria-label={label}
        >
          {items}
        </div>
      )}
    </div>
  );
}

export default memo(NavCategory);
