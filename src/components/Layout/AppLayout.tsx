/**
 * App Layout Component
 * Layout wrapper cho MainApp với cấu hình cụ thể
 */

import { ReactNode } from 'react';
import BaseLayout from './BaseLayout';

export interface AppLayoutProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function AppLayout({
  children,
  leftPanel,
  header,
  footer,
  className,
}: AppLayoutProps) {
  return (
    <BaseLayout
      sidebar={leftPanel}
      header={header}
      footer={footer}
      className={className}
      sidebarWidth="lg"
    >
      {children}
    </BaseLayout>
  );
}
