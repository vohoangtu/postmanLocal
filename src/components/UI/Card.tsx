import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card component với consistent styling
 * Hỗ trợ title, subtitle, footer và hover effects
 */
export default function Card({
  children,
  title,
  subtitle,
  footer,
  className = '',
  hover = false,
  padding = 'md',
}: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700';
  const hoverClasses = hover ? 'transition-shadow hover:shadow-md' : '';
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`.trim()}>
      {(title || subtitle) && (
        <div className={`${paddingClasses[padding]} pb-0`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className={`${paddingClasses[padding]} pt-0 border-t border-gray-200 dark:border-gray-700 mt-4`}>
          {footer}
        </div>
      )}
    </div>
  );
}
