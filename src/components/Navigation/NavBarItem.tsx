/**
 * Navigation Bar Item Component
 * Component cho navigation items trong GlobalNavBar (horizontal layout)
 * Khác với NavItem dùng cho sidebar (vertical layout)
 */

import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import FeatureGate from '../FeatureGate/FeatureGate';
import { cn } from '../../utils/cn';

export interface NavBarItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  isActive?: boolean;
  feature?: string;
  className?: string;
  showLabel?: boolean | 'responsive'; // Hiển thị label: true/false hoặc 'responsive' (ẩn trên lg, hiện trên xl)
  size?: 'sm' | 'md' | 'lg';
}

function NavBarItem({
  id,
  label,
  icon: Icon,
  onClick,
  isActive = false,
  feature,
  className,
  showLabel = true,
  size = 'md',
}: NavBarItemProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  // Xác định classes cho label
  const labelClasses = showLabel === 'responsive' 
    ? 'hidden xl:inline' 
    : showLabel === false 
    ? 'hidden' 
    : '';

  const button = (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-1.5 rounded-md transition-all duration-200 whitespace-nowrap',
        sizeClasses[size],
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold shadow-sm border border-blue-200 dark:border-blue-800'
          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium',
        className
      )}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon 
        size={iconSizes[size]} 
        className={isActive ? 'text-blue-700 dark:text-blue-300' : ''} 
        aria-hidden="true"
      />
      <span className={labelClasses}>{label}</span>
      {isActive && (
        <span 
          className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-600 dark:bg-blue-400 rounded-full shadow-sm"
          aria-hidden="true"
        />
      )}
    </button>
  );

  // Nếu có feature gate, wrap button
  if (feature) {
    return (
      <FeatureGate
        feature={feature}
        showMessage={false}
        fallback={
          <button
            className={cn(
              'relative flex items-center gap-1.5 rounded-md transition-all duration-200 whitespace-nowrap opacity-50 cursor-not-allowed',
              sizeClasses[size],
              'text-gray-400 dark:text-gray-600'
            )}
            title={`${label} - Cần hoàn thành hướng dẫn`}
            disabled
          >
            <Icon size={iconSizes[size]} aria-hidden="true" />
            <span className={labelClasses}>{label}</span>
          </button>
        }
      >
        {button}
      </FeatureGate>
    );
  }

  return button;
}

export default memo(NavBarItem);
