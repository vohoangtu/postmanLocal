/**
 * Workspace Layout Component
 * Layout wrapper với sidebar navigation cho workspace page
 */

import { ReactNode, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useWorkspacePermission } from '../../hooks/useWorkspacePermission';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceBreadcrumb from '../Navigation/WorkspaceBreadcrumb';
import CollaborationSidebar from './CollaborationSidebar';
import Tooltip from '../UI/Tooltip';
import { FolderOpen, Users, Activity, BarChart3, CheckSquare, MessageSquare, Settings, ClipboardCheck, FileCode, Code2, GitBranch, Server, TestTube, Layers, Eye } from 'lucide-react';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  teamOnly?: boolean;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const permissions = useWorkspacePermission(currentWorkspace);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load workspace if not loaded
  useEffect(() => {
    if (id && (!currentWorkspace || currentWorkspace.id.toString() !== id)) {
      loadWorkspace(id);
    }
  }, [id, currentWorkspace, loadWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải workspace...</div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: `/workspace/${id}`,
    },
    {
      id: 'collections',
      label: 'Collections',
      icon: FolderOpen,
      path: `/workspace/${id}/collections`,
    },
    ...(currentWorkspace.is_team
      ? [
          {
            id: 'members',
            label: 'Members',
            icon: Users,
            path: `/workspace/${id}/members`,
            teamOnly: true,
          },
          {
            id: 'tasks',
            label: 'Tasks',
            icon: CheckSquare,
            path: `/workspace/${id}/tasks`,
            teamOnly: true,
          },
          {
            id: 'discussions',
            label: 'Discussions',
            icon: MessageSquare,
            path: `/workspace/${id}/discussions`,
            teamOnly: true,
          },
          {
            id: 'reviews',
            label: 'Reviews',
            icon: ClipboardCheck,
            path: `/workspace/${id}/reviews`,
            teamOnly: true,
          },
          {
            id: 'activity',
            label: 'Activity',
            icon: Activity,
            path: `/workspace/${id}/activity`,
            teamOnly: true,
          },
          {
            id: 'live',
            label: 'Live',
            icon: Activity,
            path: `/workspace/${id}/live`,
            teamOnly: true,
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: BarChart3,
            path: `/workspace/${id}/analytics`,
            teamOnly: true,
          },
          {
            id: 'documentation',
            label: 'Documentation',
            icon: FileCode,
            path: `/workspace/${id}/documentation`,
            teamOnly: true,
          },
          {
            id: 'api-schema',
            label: 'Schema Editor',
            icon: Code2,
            path: `/workspace/${id}/api-schema`,
            teamOnly: true,
          },
          {
            id: 'api-versions',
            label: 'API Versions',
            icon: GitBranch,
            path: `/workspace/${id}/api-versions`,
            teamOnly: true,
          },
          {
            id: 'api-mocking',
            label: 'Mock Servers',
            icon: Server,
            path: `/workspace/${id}/api-mocking`,
            teamOnly: true,
          },
          {
            id: 'api-testing',
            label: 'Test Suites',
            icon: TestTube,
            path: `/workspace/${id}/api-testing`,
            teamOnly: true,
          },
          {
            id: 'api-templates',
            label: 'Templates',
            icon: Layers,
            path: `/workspace/${id}/api-templates`,
            teamOnly: true,
          },
          {
            id: 'design-reviews',
            label: 'Design Reviews',
            icon: Eye,
            path: `/workspace/${id}/design-reviews`,
            teamOnly: true,
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: `/workspace/${id}/settings`,
    },
  ];

  const activeNavId = navItems.find((item) => location.pathname === item.path)?.id || 'collections';

  // Keyboard shortcuts cho navigation
  useKeyboardShortcuts([
    {
      key: '1',
      ctrl: true,
      handler: () => navigate(`/workspace/${id}/collections`),
      description: 'Go to Collections',
    },
    {
      key: '2',
      ctrl: true,
      handler: () => {
        if (currentWorkspace?.is_team) {
          navigate(`/workspace/${id}/members`);
        }
      },
      description: 'Go to Members',
    },
    {
      key: '9',
      ctrl: true,
      handler: () => navigate(`/workspace/${id}/settings`),
      description: 'Go to Settings',
    },
  ]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <WorkspaceHeader workspace={currentWorkspace} />
      <WorkspaceBreadcrumb />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r-2 border-gray-300 dark:border-gray-700 flex flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;
              
              return (
                <Tooltip key={item.id} content={item.label} position="right">
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold border-2 border-blue-500 dark:border-blue-400 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                    }`}
                    title={item.label}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-700 dark:text-blue-300' : ''} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/30">
          {children}
        </div>

        {/* Collaboration Sidebar - chỉ team workspace */}
        {currentWorkspace.is_team && (
          <CollaborationSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}
      </div>
    </div>
  );
}
