/**
 * Layout Styling Utilities
 * Common layout class names để đảm bảo consistency
 */

export const layoutStyles = {
  // Container chính cho toàn bộ app - chỉ overflow-hidden ở root để tránh body scroll
  container: 'flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden',
  
  // Main content area - cho phép scroll nội bộ
  contentArea: 'flex-1 flex min-w-0 relative',
  
  // Sidebar base styles
  sidebarBase: 'bg-white dark:bg-gray-800 border-r-2 border-gray-300 dark:border-gray-700 flex flex-col',
  
  // Sidebar navigation - có scroll riêng
  sidebarNav: 'flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
  
  // Main content wrapper - cho phép scroll
  mainContent: 'flex-1 flex flex-col min-w-0',
  
  // Content area với background - có scroll
  contentWithBg: 'flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/30',
  
  // Divider giữa sidebar và content
  divider: 'w-px bg-gray-300 dark:bg-gray-700 flex-shrink-0',
  
  // Panel container
  panelContainer: 'w-full md:w-80 lg:w-96 flex-shrink-0',
  
  // Mobile overlay
  mobileOverlay: 'fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity',
  
  // Loading container
  loadingContainer: 'flex items-center justify-center h-screen',
  
  // Empty state container
  emptyStateContainer: 'flex-1 flex items-center justify-center bg-white dark:bg-gray-800',
  
  // Page layout styles
  pageContainer: 'mx-auto w-full max-w-7xl',
  pageToolbar: 'flex items-center justify-between gap-4 flex-wrap',
  pageContent: 'flex-1 overflow-y-auto',
  
  // Grid layouts
  grid1Col: 'grid grid-cols-1 gap-4',
  grid2Col: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  grid3Col: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  grid4Col: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
} as const;
