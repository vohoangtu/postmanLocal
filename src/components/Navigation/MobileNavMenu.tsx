/**
 * Mobile Navigation Menu Component
 * Mobile menu cho GlobalNavBar
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { NavItemConfig, getCoreNavItems, getToolsNavItems, getCollaborationNavItems } from './navConfig';

export interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItemConfig[];
  onNavItemClick: (view: string) => void;
  onNewRequest: () => void;
  currentPath: string;
}

function MobileNavMenu({
  isOpen,
  onClose,
  navItems,
  onNavItemClick,
  onNewRequest,
  currentPath,
}: MobileNavMenuProps) {
  if (!isOpen) return null;

  const coreItems = getCoreNavItems(navItems);
  const toolsItems = getToolsNavItems(navItems);
  const collaborationItems = getCollaborationNavItems(navItems);

  const handleItemClick = (view: string) => {
    onNavItemClick(view);
    onClose();
  };

  return (
    <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2">
      <Link
        to="/"
        onClick={onClose}
        className={`block px-4 py-2 text-sm transition-colors ${
          currentPath === '/'
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        Home
      </Link>
      
      <button
        onClick={() => {
          onNewRequest();
          onClose();
        }}
        className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        New Request
      </button>

      {/* Core Items */}
      {coreItems.length > 0 && (
        <>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Navigation
          </div>
          {coreItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.view || '')}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </>
      )}

      {/* Tools Items */}
      {toolsItems.length > 0 && (
        <>
          {toolsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.view || '')}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </>
      )}

      {/* Collaboration Items */}
      {collaborationItems.length > 0 && (
        <>
          {collaborationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.view || '')}
                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

export default memo(MobileNavMenu);
