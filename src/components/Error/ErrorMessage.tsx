/**
 * Error Message Component
 * Component hiển thị error message đẹp với nhiều variants
 */

import { AlertCircle, X, Info, AlertTriangle, Ban } from 'lucide-react';
import Button from '../UI/Button';

export type ErrorType = 'network' | 'validation' | 'server' | 'client' | 'unknown';

interface ErrorMessageProps {
  error: string | Error | { message: string; type?: ErrorType; code?: string };
  variant?: 'inline' | 'toast' | 'banner' | 'modal';
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({
  error,
  variant = 'inline',
  onDismiss,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  // Parse error
  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error 
    ? error.message 
    : error.message || 'An error occurred';
  
  const errorType: ErrorType = typeof error === 'object' && !(error instanceof Error) && error.type
    ? error.type
    : errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')
    ? 'network'
    : errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('required')
    ? 'validation'
    : errorMessage.toLowerCase().includes('server') || errorMessage.toLowerCase().includes('500')
    ? 'server'
    : 'unknown';

  const errorCode = typeof error === 'object' && !(error instanceof Error) && error.code
    ? error.code
    : undefined;

  // Icons và colors theo error type
  const errorConfig = {
    network: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    validation: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    server: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    client: {
      icon: Ban,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-800 dark:text-orange-200',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    unknown: {
      icon: AlertCircle,
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-700',
      textColor: 'text-gray-800 dark:text-gray-200',
      iconColor: 'text-gray-600 dark:text-gray-400',
    },
  };

  const config = errorConfig[errorType];
  const Icon = config.icon;

  // Variant: inline
  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-2 p-3 rounded-lg border-2 ${config.borderColor} ${config.bgColor} ${className}`}>
        <Icon size={20} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {errorMessage}
          </p>
          {errorCode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Error code: {errorCode}
            </p>
          )}
        </div>
        {(onDismiss || onRetry) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`p-1 rounded hover:bg-opacity-20 ${config.iconColor} hover:opacity-80`}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant: banner
  if (variant === 'banner') {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor} ${className}`}>
        <Icon size={24} className={config.iconColor} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${config.textColor}`}>
            {errorMessage}
          </p>
          {errorCode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Error code: {errorCode}
            </p>
          )}
        </div>
        {(onDismiss || onRetry) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`p-1 rounded hover:bg-opacity-20 ${config.iconColor} hover:opacity-80`}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant: modal (sẽ được implement sau nếu cần)
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 ${config.borderColor}`}>
          <div className="flex items-start gap-3">
            <Icon size={24} className={`${config.iconColor} flex-shrink-0`} />
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
                Error
              </h3>
              <p className={`text-sm ${config.textColor} mb-4`}>
                {errorMessage}
              </p>
              {errorCode && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Error code: {errorCode}
                </p>
              )}
              <div className="flex items-center gap-2 justify-end">
                {onRetry && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onRetry}
                  >
                    Retry
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDismiss}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: inline
  return null;
}
