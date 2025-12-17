/**
 * Workspace Layout Component
 * Layout wrapper với sidebar navigation cho workspace page
 */

import { ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceBreadcrumb from '../Navigation/WorkspaceBreadcrumb';
import CollaborationSidebar from './CollaborationSidebar';
import NavItem from '../Navigation/NavItem';
import NavCategory from '../Navigation/NavCategory';
import WorkspaceLayoutWrapper from '../Layout/WorkspaceLayoutWrapper';
import { layoutStyles } from '../../utils/layoutStyles';
import { LucideIcon } from 'lucide-react';
import { FolderOpen, Users, Activity, BarChart3, CheckSquare, MessageSquare, Settings, ClipboardCheck, FileCode, Code2, GitBranch, Server, TestTube, Layers, Eye } from 'lucide-react';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

interface WorkspaceNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  teamOnly?: boolean;
}

interface WorkspaceNavCategory {
  id: string;
  label: string;
  items: WorkspaceNavItem[];
  teamOnly?: boolean;
  defaultExpanded?: boolean;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace, loadWorkspace } = useWorkspaceStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'collaboration']));

  // Load workspace if not loaded
  useEffect(() => {
    if (id && (!currentWorkspace || currentWorkspace.id.toString() !== id)) {
      loadWorkspace(id);
    }
  }, [id, currentWorkspace, loadWorkspace]);

  if (!currentWorkspace) {
    return (
      <div className={layoutStyles.loadingContainer}>
        <div className="text-gray-500">Đang tải workspace...</div>
      </div>
    );
  }

  // Tổ chức navigation theo categories
  const navCategories: WorkspaceNavCategory[] = useMemo(() => [
    {
      id: 'core',
      label: 'Core',
      defaultExpanded: true,
      items: [
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
      ],
    },
    ...(currentWorkspace.is_team
      ? [
          {
            id: 'collaboration',
            label: 'Collaboration',
            teamOnly: true,
            defaultExpanded: true,
            items: [
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
            ],
          },
          {
            id: 'api-design',
            label: 'API Design',
            teamOnly: true,
            defaultExpanded: false,
            items: [
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
                id: 'design-reviews',
                label: 'Design Reviews',
                icon: Eye,
                path: `/workspace/${id}/design-reviews`,
                teamOnly: true,
              },
              {
                id: 'documentation',
                label: 'Documentation',
                icon: FileCode,
                path: `/workspace/${id}/documentation`,
                teamOnly: true,
              },
            ],
          },
          {
            id: 'testing',
            label: 'Testing & Development',
            teamOnly: true,
            defaultExpanded: false,
            items: [
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
            ],
          },
          {
            id: 'analytics',
            label: 'Analytics',
            teamOnly: true,
            defaultExpanded: false,
            items: [
              {
                id: 'analytics',
                label: 'Analytics',
                icon: BarChart3,
                path: `/workspace/${id}/analytics`,
                teamOnly: true,
              },
            ],
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'Settings',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: `/workspace/${id}/settings`,
        },
      ],
    },
  ], [id, currentWorkspace.is_team]);

  // Initialize expanded categories
  useEffect(() => {
    const initialExpanded = new Set<string>();
    navCategories.forEach((category) => {
      if (category.defaultExpanded) {
        initialExpanded.add(category.id);
      }
    });
    setExpandedCategories(initialExpanded);
  }, [navCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Flatten all items để tìm active item
  const allNavItems = useMemo(() => navCategories.flatMap((cat) => cat.items), [navCategories]);
  const activeNavId = useMemo(() => 
    allNavItems.find((item) => location.pathname === item.path)?.id || 'collections',
    [allNavItems, location.pathname]
  );

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

  // Render sidebar navigation
  const renderSidebar = () => (
    <nav className={layoutStyles.sidebarNav}>
      {navCategories.map((category) => {
        // Skip team-only categories if not team workspace
        if (category.teamOnly && !currentWorkspace.is_team) {
          return null;
        }

        const isExpanded = expandedCategories.has(category.id);
        const hasActiveItem = category.items.some((item) => item.id === activeNavId);

        // Render nav items
        const navItems = category.items.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            onClick={() => navigate(item.path)}
            isActive={activeNavId === item.id}
            showTooltip={true}
            tooltipPosition="right"
          />
        ));

        return (
          <NavCategory
            key={category.id}
            id={category.id}
            label={category.label}
            items={navItems}
            isExpanded={isExpanded}
            onToggle={() => toggleCategory(category.id)}
            hasActiveItem={hasActiveItem}
            teamOnly={category.teamOnly}
          />
        );
      })}
    </nav>
  );

  // Render right sidebar (collaboration sidebar)
  const renderRightSidebar = () => {
    if (!currentWorkspace.is_team) return null;
    
    return (
      <CollaborationSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
    );
  };

  return (
    <WorkspaceLayoutWrapper
      sidebar={renderSidebar()}
      header={
        <>
          <WorkspaceHeader workspace={currentWorkspace} />
          <WorkspaceBreadcrumb />
        </>
      }
      rightSidebar={renderRightSidebar()}
      contentClassName={layoutStyles.contentWithBg}
    >
      {children}
    </WorkspaceLayoutWrapper>
  );
}
