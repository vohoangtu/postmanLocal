/**
 * User Panel Component
 * Layout cho user panel với tabs
 */

import { useState } from 'react';
import UserSidebar from './UserSidebar';
import ProfileSettings from './ProfileSettings';
import PasswordSettings from './PasswordSettings';
import PreferencesSettings from './PreferencesSettings';
import SubscriptionSettings from './SubscriptionSettings';
import MockServerSettings from '../Settings/MockServerSettings';

type Tab = 'profile' | 'password' | 'preferences' | 'subscription' | 'mock-server';

export default function UserPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'password':
        return <PasswordSettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'subscription':
        return <SubscriptionSettings />;
      case 'mock-server':
        return <MockServerSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <UserSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
