/**
 * useAsyncOperation Hook
 * Generic hook cho async operations với loading/error/success states
 */

import { useState, useCallback, useRef } from 'react';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncOperationResult<T> extends AsyncOperationState<T> {
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Hook để quản lý async operations
 */
export function useAsyncOperation<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    immediate?: boolean;
  }
): AsyncOperationResult<T> {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Use refs để tránh dependency issues
  const asyncFunctionRef = useRef(asyncFunction);
  const optionsRef = useRef(options);

  // Update refs khi function hoặc options thay đổi
  asyncFunctionRef.current = asyncFunction;
  optionsRef.current = options;

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunctionRef.current(...args);
        setState({
          data: result,
          loading: false,
          error: null,
        });

        if (optionsRef.current?.onSuccess) {
          optionsRef.current.onSuccess(result);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (optionsRef.current?.onError) {
          optionsRef.current.onError(error instanceof Error ? error : new Error(errorMessage));
        }

        throw error;
      }
    },
    [] // Empty dependency array vì chúng ta dùng refs
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useAsyncOperation;
