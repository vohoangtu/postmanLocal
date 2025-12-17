/**
 * Navigation Item Component
 * Reusable component cho navigation items với active state, icons, tooltips
 */

import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import Tooltip from '../UI/Tooltip';
import { cn } from '../../utils/cn';

export interface NavItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
  isActive?: boolean;
  showTooltip?: boolean;
  tooltipPosition?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

function NavItem({
  id,
  label,
  icon: Icon,
  path,
  onClick,
  isActive = false,
  showTooltip = true,
  tooltipPosition = 'right',
  className,
  disabled = false,
  'aria-label': ariaLabel,
}: NavItemProps) {
  const buttonContent = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group relative',
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={label}
      aria-label={ariaLabel || label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon 
        size={16} 
        className={isActive ? 'text-blue-700 dark:text-blue-300' : ''} 
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
      {isActive && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full"
          aria-hidden="true"
        />
      )}
    </button>
  );

  if (showTooltip && !isActive) {
    return (
      <Tooltip content={label} position={tooltipPosition}>
        {buttonContent}
      </Tooltip>
    );
  }

  return buttonContent;
}

export default memo(NavItem);
