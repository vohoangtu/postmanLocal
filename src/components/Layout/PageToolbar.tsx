/**
 * Page Toolbar Component
 * Toolbar component cho các page với Environment selector, Workspace selector và action buttons
 */

import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface PageToolbarProps {
  children?: ReactNode;
  className?: string;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
}

export default function PageToolbar({
  children,
  className,
  leftSection,
  rightSection,
}: PageToolbarProps) {
  // Nếu có leftSection hoặc rightSection, sử dụng layout 2 cột
  if (leftSection || rightSection) {
    return (
      <div className={cn(
        'flex items-center justify-between gap-4',
        'flex-wrap',
        className
      )}>
        {leftSection && (
          <div className="flex items-center gap-3 flex-wrap">
            {leftSection}
          </div>
        )}
        {rightSection && (
          <div className="flex items-center gap-2 flex-wrap">
            {rightSection}
          </div>
        )}
      </div>
    );
  }

  // Default: render children với flex layout
  return (
    <div className={cn(
      'flex items-center gap-3 flex-wrap',
      className
    )}>
      {children}
    </div>
  );
}
