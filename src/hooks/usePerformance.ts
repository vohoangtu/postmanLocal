import { useEffect, useRef } from "react";
import { performanceMonitor } from "../services/performanceMonitor";

/**
 * Hook to track component render performance
 */
export function usePerformance(componentName: string) {
  const renderStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current;
    performanceMonitor.trackRender(componentName, renderTime);
    renderStartRef.current = Date.now();
  });
}

/**
 * Hook to measure async operation performance
 */
export function useAsyncPerformance(operationName: string) {
  const startTimeRef = useRef<number | null>(null);

  const start = () => {
    startTimeRef.current = Date.now();
  };

  const end = () => {
    if (startTimeRef.current !== null) {
      const duration = Date.now() - startTimeRef.current;
      performanceMonitor.trackRequest(operationName, duration);
      startTimeRef.current = null;
    }
  };

  return { start, end };
}


