import { ReactNode } from "react";

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

export default function SkeletonLoader({
  className = "",
  count = 1,
  height = "1rem",
  width = "100%",
}: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
          style={{ height, width }}
        />
      ))}
    </>
  );
}

// Pre-built skeleton components
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          height={i === lines - 1 ? "0.75rem" : "1rem"}
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded">
      <SkeletonLoader height="1.5rem" width="60%" className="mb-3" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-2">
        <SkeletonLoader height="2rem" width="20%" />
        <SkeletonLoader height="2rem" width="30%" />
        <SkeletonLoader height="2rem" width="25%" />
        <SkeletonLoader height="2rem" width="25%" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <SkeletonLoader height="3rem" width="20%" />
          <SkeletonLoader height="3rem" width="30%" />
          <SkeletonLoader height="3rem" width="25%" />
          <SkeletonLoader height="3rem" width="25%" />
        </div>
      ))}
    </div>
  );
}
