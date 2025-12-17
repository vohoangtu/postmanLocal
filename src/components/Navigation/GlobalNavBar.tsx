/**
 * Global Navigation Bar
 * Navigation bar chung cho toàn bộ app, hiển thị ở tất cả các trang (trừ login/register)
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useNavigation } from '../../contexts/NavigationContext';
import Button from '../UI/Button';
import NotificationCenter from '../Notifications/NotificationCenter';
import MobileNavMenu from './MobileNavMenu';
import NavBarItem from './NavBarItem';
import { mainAppNavItems, getCoreNavItems, getToolsNavItems, getCollaborationNavItems } from './navConfig';
import { cn } from '../../utils/cn';
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Sun, 
  Moon,
  FileText,
  Menu,
  X,
  Shield
} from 'lucide-react';

export default function GlobalNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { preferences, setPreferencesLocal, updatePreferences } = useUserPreferencesStore();
  const { activeView, handleViewChange, handleNewRequest } = useNavigation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Workspace loading removed - không còn workspace concept

  // Kiểm tra theme hiện tại và sync với preferences
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      const isCurrentlyDark = root.classList.contains('dark');
      setIsDark(isCurrentlyDark);
    };
    
    // Kiểm tra theme ban đầu
    checkTheme();
    
    // Listen cho changes từ DOM
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Listen cho storage events (sync giữa các tabs)
    const handleStorageChange = () => {
      checkTheme();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Sync với preferences store
    if (preferences.theme) {
      const root = document.documentElement;
      const shouldBeDark = preferences.theme === 'dark' || 
        (preferences.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (shouldBeDark && !root.classList.contains('dark')) {
        root.classList.add('dark');
        setIsDark(true);
      } else if (!shouldBeDark && root.classList.contains('dark')) {
        root.classList.remove('dark');
        setIsDark(false);
      }
    }
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [preferences.theme]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle theme
  const handleToggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    
    // Apply theme ngay lập tức
    setPreferencesLocal({ theme: newTheme });
    
    // Cập nhật state để UI phản ánh ngay
    setIsDark(newTheme === 'dark');
    
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.log('Theme updated locally');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Kiểm tra xem có đang ở collection page không
  const isCollectionPage = location.pathname.startsWith('/collections/');
  const isMainAppPage = location.pathname === '/' || location.pathname.startsWith('/user') || location.pathname.startsWith('/admin');

  // Navigation items từ navConfig
  const navItems = useMemo(() => mainAppNavItems, []);
  const coreItems = useMemo(() => getCoreNavItems(navItems), [navItems]);
  const toolsItems = useMemo(() => getToolsNavItems(navItems), [navItems]);
  const collaborationItems = useMemo(() => getCollaborationNavItems(navItems), [navItems]);

  // Handle nav item click
  const handleNavItemClick = useCallback((view: string) => {
    if (view) {
      handleViewChange(view as any);
    }
  }, [handleViewChange]);

  // Không hiển thị trên login/register pages
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/login/')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b-2 border-gray-300 dark:border-gray-700 shadow-md">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side: Logo và Navigation */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                PL
              </div>
              <span className="text-gray-900 dark:text-white font-bold text-sm hidden sm:block">
                PostmanLocal
              </span>
            </Link>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 hidden md:block flex-shrink-0" />

            {/* Home button */}
            <Link
              to="/"
              className={cn(
                'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors flex-shrink-0',
                location.pathname === '/'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
              )}
            >
              <Home size={16} />
              <span>Home</span>
            </Link>

            {/* Quick actions - New Request */}
            {user && (
              <>
                <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 hidden md:block flex-shrink-0" />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNewRequest}
                  className="hidden md:flex items-center gap-1.5 flex-shrink-0"
                  disabled={!user}
                  title={!user ? "Vui lòng đăng nhập để tạo request" : "Tạo request mới"}
                >
                  <FileText size={16} />
                  <span>New Request</span>
                </Button>
              </>
            )}

            {/* Navigation Items - chỉ hiển thị ở MainApp */}
            {isMainAppPage && user && (
              <>
                <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 hidden md:block flex-shrink-0" />
                
                {/* Core Items */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  {coreItems.map((item) => (
                    <NavBarItem
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      icon={item.icon}
                      onClick={() => item.view && handleViewChange(item.view)}
                      isActive={activeView === item.view}
                      feature={item.feature}
                      size="md"
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 hidden lg:block mx-1 flex-shrink-0" />

                {/* Tools và Collaboration Items */}
                <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {/* Tools Items */}
                  {toolsItems.map((item) => (
                    <NavBarItem
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      icon={item.icon}
                      onClick={() => item.view && handleViewChange(item.view)}
                      isActive={activeView === item.view}
                      feature={item.feature}
                      size="md"
                      showLabel="responsive" // Hiển thị label trên xl screens
                    />
                  ))}

                  {/* Collaboration Items */}
                  {collaborationItems.length > 0 && (
                    <>
                      <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-2 flex-shrink-0" />
                      {collaborationItems.map((item) => (
                        <NavBarItem
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          icon={item.icon}
                          onClick={() => item.view && handleViewChange(item.view)}
                          isActive={activeView === item.view}
                          feature={item.feature}
                          size="md"
                          showLabel="responsive" // Hiển thị label trên xl screens
                        />
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right side: Search, Theme, User menu */}
          <div className="flex items-center gap-2">
            {/* Search - có thể thêm sau */}
            {/* <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Search size={16} />
            </button> */}

            {/* Theme toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun size={20} className="text-yellow-600" />
              ) : (
                <Moon size={20} />
              )}
            </button>

            {/* Notification Center */}
            {user && <NotificationCenter />}

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                  <ChevronDown size={14} className="hidden md:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-300 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                    <Link
                      to="/user"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <Link
                      to="/user/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMainAppPage && user && (
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            navItems={navItems}
            onNavItemClick={handleNavItemClick}
            onNewRequest={handleNewRequest}
            currentPath={location.pathname}
          />
        )}
      </div>
    </nav>
  );
}
