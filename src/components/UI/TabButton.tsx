import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Tab có đang active không
   */
  active?: boolean;
  /**
   * Icon component (từ lucide-react)
   */
  icon?: LucideIcon;
  /**
   * Text label của tab
   */
  children: ReactNode;
  /**
   * Hiển thị active indicator (underline)
   */
  showIndicator?: boolean;
  /**
   * Variant của tab button
   */
  variant?: 'default' | 'compact' | 'filled';
}

/**
 * TabButton component thống nhất
 * Chiều cao cố định h-10, styles nhất quán cho active/inactive states
 * Hỗ trợ icon và text, active indicator, dark mode
 */
export default function TabButton({
  active = false,
  icon: Icon,
  children,
  showIndicator = true,
  variant = 'default',
  className = '',
  ...props
}: TabButtonProps) {
  // Focus ring với high contrast cho accessibility
  const baseClasses = 'h-10 px-4 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 relative focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800';
  
  // Filled variant: background blue khi active (cho request type tabs)
  const stateClasses = variant === 'filled'
    ? active
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    : active
      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700';

  const compactClasses = variant === 'compact' ? 'px-3' : '';
  const filledClasses = variant === 'filled' ? 'h-8' : '';

  const classes = `${baseClasses} ${stateClasses} ${compactClasses} ${filledClasses} ${className}`.trim();

  return (
    <button
      className={classes}
      aria-selected={active}
      role="tab"
      {...props}
    >
      {Icon && <Icon size={14} className="flex-shrink-0" />}
      <span>{children}</span>
      {active && showIndicator && variant !== 'filled' && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
      )}
    </button>
  );
}
