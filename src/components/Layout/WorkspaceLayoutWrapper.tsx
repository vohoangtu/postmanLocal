/**
 * Workspace Layout Wrapper Component
 * Layout wrapper cho Workspace pages với sidebar navigation
 */

import { ReactNode } from 'react';
import BaseLayout from './BaseLayout';

export interface WorkspaceLayoutWrapperProps {
  children: ReactNode;
  sidebar: ReactNode;
  header?: ReactNode;
  rightSidebar?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function WorkspaceLayoutWrapper({
  children,
  sidebar,
  header,
  rightSidebar,
  className,
  contentClassName,
}: WorkspaceLayoutWrapperProps) {
  return (
    <BaseLayout
      sidebar={sidebar}
      header={header}
      rightSidebar={rightSidebar}
      className={className}
      contentClassName={contentClassName}
      sidebarWidth="md"
    >
      {children}
    </BaseLayout>
  );
}
