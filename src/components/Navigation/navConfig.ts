/**
 * Navigation Configuration
 * Centralized navigation configuration để reuse giữa các components
 */

import { 
  Folder, 
  History, 
  Settings, 
  FileCode, 
  BookOpen, 
  Server, 
  Link2,
  LucideIcon 
} from 'lucide-react';

export type NavView = 
  | "collections" 
  | "history" 
  | "templates" 
  | "environments" 
  | "schema" 
  | "mock" 
  | "docs" 
  | "workspaces" 
  | "chains" 
  | null;

export type NavGroup = "core" | "tools" | "collaboration";

export interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  view: NavView;
  feature?: string;
  group: NavGroup;
  teamOnly?: boolean;
}

// Navigation items cho MainApp (GlobalNavBar)
export const mainAppNavItems: NavItemConfig[] = [
  // Core - Chức năng chính
  {
    id: "collections",
    icon: Folder,
    label: "Collections",
    view: "collections",
    feature: "collections",
    group: "core",
  },
  {
    id: "history",
    icon: History,
    label: "History",
    view: "history",
    feature: "view_history",
    group: "core",
  },
  // Tools - Công cụ hỗ trợ
  {
    id: "environments",
    icon: Settings,
    label: "Environments",
    view: "environments",
    feature: "environments",
    group: "tools",
  },
  {
    id: "templates",
    icon: FileCode,
    label: "Templates",
    view: "templates",
    feature: "templates",
    group: "tools",
  },
  {
    id: "schema",
    icon: BookOpen,
    label: "Schema",
    view: "schema",
    feature: "view_history",
    group: "tools",
  },
  {
    id: "mock",
    icon: Server,
    label: "Mock Server",
    view: "mock",
    feature: "mock_server",
    group: "tools",
  },
  // Collaboration - Cộng tác
  {
    id: "chains",
    icon: Link2,
    label: "Chains",
    view: "chains",
    feature: "request_chaining",
    group: "collaboration",
  },
];

// Helper functions để filter nav items
export function getNavItemsByGroup(items: NavItemConfig[], group: NavGroup): NavItemConfig[] {
  return items.filter(item => item.group === group);
}

export function getCoreNavItems(items: NavItemConfig[]): NavItemConfig[] {
  return getNavItemsByGroup(items, 'core');
}

export function getToolsNavItems(items: NavItemConfig[]): NavItemConfig[] {
  return getNavItemsByGroup(items, 'tools');
}

export function getCollaborationNavItems(items: NavItemConfig[]): NavItemConfig[] {
  return getNavItemsByGroup(items, 'collaboration');
}
