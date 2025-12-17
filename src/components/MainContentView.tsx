/**
 * Main Content View Component
 * Hiển thị các chức năng chính trong main content area khi không có Request Builder active
 * Collections, Chains, Mock Server sẽ hiển thị ở đây thay vì trong LeftPanel
 */

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import FeatureGate from './FeatureGate/FeatureGate';

// Lazy load các components lớn
const PublicCollectionManager = lazy(() => import('./Collections/PublicCollectionManager'));
const RequestChainBuilder = lazy(() => import('./RequestChaining/RequestChainBuilder'));
const RequestHistory = lazy(() => import('./RequestHistory/RequestHistory'));
const TemplateLibrary = lazy(() => import('./Templates/TemplateLibrary'));
const EnvironmentManager = lazy(() => import('./Environment/EnvironmentManager'));
const MockServerPanel = lazy(() => import('./MockServer/MockServerPanel'));

interface MainContentViewProps {
  view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
}

export default function MainContentView({ view }: MainContentViewProps) {
  if (!view) {
    return null;
  }

  const renderContent = () => {
    switch (view) {
      case "collections":
        return (
          <FeatureGate feature="collections">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            }>
              <PublicCollectionManager />
            </Suspense>
          </FeatureGate>
        );

      case "chains":
        return (
          <FeatureGate feature="request_chaining">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            }>
              <RequestChainBuilder />
            </Suspense>
          </FeatureGate>
        );

      case "history":
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          }>
            <RequestHistory />
          </Suspense>
        );

      case "templates":
        return (
          <FeatureGate feature="templates">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            }>
              <TemplateLibrary />
            </Suspense>
          </FeatureGate>
        );

      case "environments":
        return (
          <FeatureGate feature="environments">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            }>
              <EnvironmentManager />
            </Suspense>
          </FeatureGate>
        );

      case "mock":
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          }>
            <MockServerPanel />
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-gray-900">
      {renderContent()}
    </div>
  );
}
