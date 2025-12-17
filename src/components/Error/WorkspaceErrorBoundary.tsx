/**
 * WorkspaceErrorBoundary Component
 * Error boundary cho workspace components với better error recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '../UI/Button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class WorkspaceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WorkspaceErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler nếu có
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Có thể log error đến error tracking service ở đây
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI nếu có
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-red-300 dark:border-red-700">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Đã xảy ra lỗi
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Có vấn đề xảy ra khi tải workspace. Vui lòng thử lại hoặc quay về trang chủ.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && errorInfo && (
          <details className="mb-4">
            <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer mb-2">
              Chi tiết lỗi (Development)
            </summary>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-40">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={onReset}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Thử lại
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home size={16} />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceErrorBoundary;
