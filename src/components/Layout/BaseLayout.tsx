/**
 * Base Layout Component
 * Component base cho tất cả layouts với common patterns
 * Xử lý flex container, dark mode, responsive
 */

import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { layoutStyles } from '../../utils/layoutStyles';

export interface BaseLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  rightSidebar?: ReactNode;
  className?: string;
  contentClassName?: string;
  sidebarWidth?: 'sm' | 'md' | 'lg';
}

const sidebarWidths = {
  sm: 'w-48',
  md: 'w-64',
  lg: 'w-80',
};

export default function BaseLayout({
  children,
  sidebar,
  header,
  footer,
  rightSidebar,
  className,
  contentClassName,
  sidebarWidth = 'md',
}: BaseLayoutProps) {
  return (
    <div className={cn(layoutStyles.container, className)}>
      {/* Header */}
      {header && (
        <header className="flex-shrink-0">
          {header}
        </header>
      )}

      {/* Main Layout */}
      <div className={layoutStyles.contentArea}>
        {/* Left Sidebar */}
        {sidebar && (
          <aside className={cn(layoutStyles.sidebarBase, sidebarWidths[sidebarWidth])}>
            {sidebar}
          </aside>
        )}

        {/* Divider giữa sidebar và content */}
        {sidebar && (
          <div className={cn(layoutStyles.divider, 'hidden md:block')} />
        )}

        {/* Main Content */}
        <main className={cn(layoutStyles.mainContent, contentClassName)}>
          {children}
        </main>

        {/* Right Sidebar */}
        {rightSidebar && (
          <>
            <div className={cn(layoutStyles.divider, 'hidden md:block')} />
            <aside className={cn(layoutStyles.sidebarBase, sidebarWidths[sidebarWidth])}>
              {rightSidebar}
            </aside>
          </>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
}
