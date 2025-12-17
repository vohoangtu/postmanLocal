/**
 * Page Layout Component
 * Wrapper component cho các page với proper container, padding và structure
 */

import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface PageLayoutProps {
  children: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function PageLayout({
  children,
  toolbar,
  className,
  contentClassName,
  maxWidth = 'xl',
  padding = 'md',
}: PageLayoutProps) {
  return (
    <div className={cn(
      'flex-1 flex flex-col min-w-0 h-full',
      'bg-white dark:bg-gray-900',
      className
    )}>
      {/* Toolbar Section */}
      {toolbar && (
        <div className={cn(
          'flex-shrink-0',
          'border-b border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800',
          paddingClasses[padding]
        )}>
          <div className={cn(
            'mx-auto w-full',
            maxWidth !== 'full' && maxWidthClasses[maxWidth]
          )}>
            {toolbar}
          </div>
        </div>
      )}

      {/* Content Section - có scroll riêng */}
      <div className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden',
        paddingClasses[padding],
        contentClassName
      )}>
        <div className={cn(
          'mx-auto w-full',
          maxWidth !== 'full' && maxWidthClasses[maxWidth]
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}
