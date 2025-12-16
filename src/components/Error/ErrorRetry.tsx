/**
 * Error Retry Component
 * Component retry button với loading state và exponential backoff
 */

import { useState } from 'react';
import Button from '../UI/Button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorRetryProps {
  onRetry: () => Promise<void> | void;
  maxRetries?: number;
  initialDelay?: number;
  className?: string;
  variant?: 'button' | 'inline';
  errorMessage?: string;
}

export default function ErrorRetry({
  onRetry,
  maxRetries = 3,
  initialDelay = 1000,
  className = '',
  variant = 'button',
  errorMessage,
}: ErrorRetryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      setHasFailed(true);
      return;
    }

    setIsRetrying(true);
    setHasFailed(false);

    try {
      // Exponential backoff: delay = initialDelay * 2^retryCount
      const delay = initialDelay * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));

      await onRetry();
      setRetryCount(0);
    } catch (error) {
      setRetryCount((prev) => prev + 1);
      if (retryCount + 1 >= maxRetries) {
        setHasFailed(true);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        {hasFailed ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Max retries reached
          </span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            loading={isRetrying}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {isRetrying ? 'Retrying...' : `Retry (${retryCount}/${maxRetries})`}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {hasFailed ? (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          <span>Failed after {maxRetries} retries</span>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={handleRetry}
          disabled={isRetrying}
          loading={isRetrying}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </div>
  );
}
