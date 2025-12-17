/**
 * User Sidebar Component
 * Sidebar navigation cho user panel
 */

import { User, Lock, Settings, CreditCard, Server } from 'lucide-react';

type Tab = 'profile' | 'password' | 'preferences' | 'subscription' | 'mock-server';

interface UserSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function UserSidebar({ activeTab, onTabChange }: UserSidebarProps) {
  const menuItems = [
    { id: 'profile' as Tab, icon: User, label: 'Profile' },
    { id: 'password' as Tab, icon: Lock, label: 'Password' },
    { id: 'preferences' as Tab, icon: Settings, label: 'Preferences' },
    { id: 'mock-server' as Tab, icon: Server, label: 'Mock Server' },
    { id: 'subscription' as Tab, icon: CreditCard, label: 'Subscription' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
