/**
 * Skeleton Loader Component
 * Pre-built skeleton loaders cho các use cases phổ biến
 */

import Skeleton from './Skeleton';

interface SkeletonLoaderProps {
  type: 'table' | 'list' | 'card-grid' | 'form' | 'request-builder';
  count?: number;
}

export default function SkeletonLoader({ type, count = 3 }: SkeletonLoaderProps) {
  switch (type) {
    case 'table':
      return (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex gap-2">
            <Skeleton variant="rectangle" width="20%" height={40} />
            <Skeleton variant="rectangle" width="30%" height={40} />
            <Skeleton variant="rectangle" width="25%" height={40} />
            <Skeleton variant="rectangle" width="25%" height={40} />
          </div>
          {/* Rows */}
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton variant="rectangle" width="20%" height={50} />
              <Skeleton variant="rectangle" width="30%" height={50} />
              <Skeleton variant="rectangle" width="25%" height={50} />
              <Skeleton variant="rectangle" width="25%" height={50} />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Skeleton variant="circle" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="40%" height={14} />
              </div>
            </div>
          ))}
        </div>
      );

    case 'card-grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Skeleton variant="rectangle" width="100%" height={120} className="mb-3" />
              <Skeleton variant="text" width="80%" height={20} className="mb-2" />
              <Skeleton variant="text" lines={2} />
            </div>
          ))}
        </div>
      );

    case 'form':
      return (
        <div className="space-y-4">
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="rectangle" width="100%" height={40} />
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="rectangle" width="100%" height={100} />
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="rectangle" width="100%" height={40} />
          <div className="flex gap-2">
            <Skeleton variant="rectangle" width={100} height={40} />
            <Skeleton variant="rectangle" width={100} height={40} />
          </div>
        </div>
      );

    case 'request-builder':
      return (
        <div className="space-y-4 p-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangle" width={80} height={36} />
            <Skeleton variant="rectangle" width={150} height={36} />
            <Skeleton variant="rectangle" width="100%" height={36} />
            <Skeleton variant="rectangle" width={80} height={36} />
            <Skeleton variant="rectangle" width={80} height={36} />
          </div>
          
          {/* Query Params */}
          <div className="space-y-2">
            <Skeleton variant="text" width="40%" height={18} />
            <Skeleton variant="rectangle" width="100%" height={40} />
            <Skeleton variant="rectangle" width="100%" height={40} />
          </div>
          
          {/* Headers */}
          <div className="space-y-2">
            <Skeleton variant="text" width="30%" height={18} />
            <Skeleton variant="rectangle" width="100%" height={40} />
            <Skeleton variant="rectangle" width="100%" height={40} />
          </div>
          
          {/* Body */}
          <div className="space-y-2">
            <Skeleton variant="text" width="35%" height={18} />
            <Skeleton variant="rectangle" width="100%" height={150} />
          </div>
        </div>
      );

    default:
      return null;
  }
}
