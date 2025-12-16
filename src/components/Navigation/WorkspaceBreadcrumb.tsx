/**
 * Workspace Breadcrumb Component
 * Hiển thị breadcrumb navigation cho workspace pages
 */

import { Link, useParams, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { ChevronRight, Home } from 'lucide-react';

export default function WorkspaceBreadcrumb() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { currentWorkspace } = useWorkspaceStore();

  // Parse current page từ pathname
  const getCurrentPageName = () => {
    const path = location.pathname;
    
    if (path.includes('/collections')) {
      if (path.includes('/requests/new')) return 'New Request';
      if (path.includes('/requests/') && !path.endsWith('/requests')) {
        const parts = path.split('/');
        const requestId = parts[parts.length - 1];
        if (requestId !== 'new') return 'Edit Request';
      }
      if (path.includes('/requests')) return 'Requests';
      return 'Collections';
    }
    
    if (path.includes('/members')) return 'Members';
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/discussions')) return 'Discussions';
    if (path.includes('/reviews')) return 'Reviews';
    if (path.includes('/activity')) return 'Activity';
    if (path.includes('/live')) return 'Live';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/documentation')) return 'Documentation';
    if (path.includes('/api-schema')) return 'Schema Editor';
    if (path.includes('/api-versions')) return 'API Versions';
    if (path.includes('/api-mocking')) return 'Mock Servers';
    if (path.includes('/api-testing')) return 'Test Suites';
    if (path.includes('/api-templates')) return 'Templates';
    if (path.includes('/design-reviews')) return 'Design Reviews';
    if (path.includes('/settings')) return 'Settings';
    
    return 'Dashboard';
  };

  if (!id || !currentWorkspace) {
    return null;
  }

  const currentPage = getCurrentPageName();

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
      >
        <Home size={16} />
        <span>Home</span>
      </Link>
      
      <ChevronRight size={14} />
      
      <Link
        to={`/workspace/${id}`}
        className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors font-medium"
      >
        {currentWorkspace.name}
      </Link>
      
      {currentPage !== 'Dashboard' && (
        <>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-gray-200 font-medium">
            {currentPage}
          </span>
        </>
      )}
    </nav>
  );
}
