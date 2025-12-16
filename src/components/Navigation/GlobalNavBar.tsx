/**
 * Global Navigation Bar
 * Navigation bar chung cho toàn bộ app, hiển thị ở tất cả các trang (trừ login/register)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import Button from '../UI/Button';
import { 
  Home, 
  Users, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Sun, 
  Moon,
  Search,
  FileText,
  Menu,
  X
} from 'lucide-react';

export default function GlobalNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { workspaces, loadWorkspaces } = useWorkspaceStore();
  const { preferences, setPreferencesLocal, updatePreferences } = useUserPreferencesStore();
  const [showWorkspacesDropdown, setShowWorkspacesDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load workspaces khi component mount
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  // Kiểm tra theme hiện tại
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [preferences.theme]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorkspacesDropdown(false);
      }
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
    setPreferencesLocal({ theme: newTheme });
    
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

  // Kiểm tra xem có đang ở workspace page không
  const isWorkspacePage = location.pathname.startsWith('/workspace/');

  // Không hiển thị trên login/register pages
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/login/')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b-2 border-gray-300 dark:border-gray-700 shadow-md">
      <div className="max-w-full mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left side: Logo và Home */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                PL
              </div>
              <span className="text-gray-900 dark:text-white font-bold text-sm hidden sm:block">
                PostmanLocal
              </span>
            </Link>

            <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 hidden md:block" />

            {/* Home button */}
            <Link
              to="/"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === '/'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
              }`}
            >
              <Home size={16} />
              <span>Home</span>
            </Link>

            {/* Workspaces dropdown */}
            {user && (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  onClick={() => setShowWorkspacesDropdown(!showWorkspacesDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    isWorkspacePage
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                  }`}
                >
                  <Users size={16} />
                  <span>Workspaces</span>
                  <ChevronDown size={14} />
                </button>

                {showWorkspacesDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-300 dark:border-gray-700 py-2 z-50 max-h-96 overflow-y-auto">
                    {workspaces.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No workspaces yet
                      </div>
                    ) : (
                      <>
                        {workspaces.map((workspace) => (
                          <Link
                            key={workspace.id}
                            to={`/workspace/${workspace.id}`}
                            onClick={() => setShowWorkspacesDropdown(false)}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="font-medium">{workspace.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {workspace.is_team ? 'Team' : 'Personal'}
                            </div>
                          </Link>
                        ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={() => {
                        setShowWorkspacesDropdown(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      View all workspaces
                    </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick actions - New Request */}
            {user && (
              <>
                <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 hidden md:block" />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="hidden md:flex items-center gap-1.5"
                >
                  <FileText size={16} />
                  <span>New Request</span>
                </Button>
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
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // Navigate to new request
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  New Request
                </Link>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Workspaces
                </div>
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    to={`/workspace/${workspace.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {workspace.name}
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
