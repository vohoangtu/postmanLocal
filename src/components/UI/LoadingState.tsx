import { ReactNode } from 'react';
import LoadingSpinner from '../Loading/LoadingSpinner';
import SkeletonLoader from '../Loading/SkeletonLoader';

export interface LoadingStateProps {
  /**
   * Loading state: 'spinner' | 'skeleton' | 'progress'
   */
  variant?: 'spinner' | 'skeleton' | 'progress';
  /**
   * Size của spinner
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Custom message
   */
  message?: string;
  /**
   * Số lượng skeleton lines (cho skeleton variant)
   */
  skeletonLines?: number;
  /**
   * Progress value (0-100) cho progress variant
   */
  progress?: number;
  /**
   * Custom content
   */
  children?: ReactNode;
  /**
   * Full screen loading
   */
  fullScreen?: boolean;
}

/**
 * LoadingState component
 * Cung cấp các variants loading: spinner, skeleton, progress
 */
export default function LoadingState({
  variant = 'spinner',
  size = 'md',
  message,
  skeletonLines = 3,
  progress,
  children,
  fullScreen = false,
}: LoadingStateProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50'
    : 'flex flex-col items-center justify-center p-8';

  if (variant === 'skeleton') {
    return (
      <div className={containerClasses}>
        <SkeletonLoader count={skeletonLines} />
        {message && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        )}
        {children}
      </div>
    );
  }

  if (variant === 'progress') {
    return (
      <div className={containerClasses}>
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {message || 'Loading...'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progress !== undefined ? `${Math.round(progress)}%` : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={containerClasses}>
      <LoadingSpinner size={size} />
      {message && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
      {children}
    </div>
  );
}
