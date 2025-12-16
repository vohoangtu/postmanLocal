import { ButtonHTMLAttributes, ReactNode } from 'react';
import LoadingSpinner from '../Loading/LoadingSpinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

/**
 * Reusable Button component với consistent styling
 * Hỗ trợ nhiều variants và sizes
 * Accessibility: ARIA labels, keyboard navigation support
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  // Focus ring với high contrast cho accessibility (WCAG AA)
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 border border-gray-400 dark:border-gray-600 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-gray-800 hover:bg-gray-200 focus:ring-gray-500 dark:text-gray-200 dark:hover:bg-gray-700 border-2 border-gray-400 dark:border-gray-600',
    link: 'bg-transparent text-blue-700 hover:text-blue-800 hover:underline focus:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300 p-0 font-semibold',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  // Link variant không cần padding từ size
  const paddingClasses = variant === 'link' ? '' : sizeClasses[size];
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses} ${className}`.trim();

  // Nếu button chỉ có icon hoặc không có text, cần aria-label
  const hasText = typeof children === 'string' || (Array.isArray(children) && children.some(c => typeof c === 'string'));
  const needsAriaLabel = !hasText && !ariaLabel && !props.title;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-label={ariaLabel || (needsAriaLabel ? 'Button' : undefined)}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className="mr-2" aria-hidden="true">
          <LoadingSpinner size="sm" />
        </span>
      )}
      {children}
    </button>
  );
}

