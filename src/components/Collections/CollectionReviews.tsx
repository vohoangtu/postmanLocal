/**
 * Collection Reviews Component
 * Quản lý request reviews trong collection
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRequestReviewStore } from '../../stores/requestReviewStore';
import EmptyState from '../EmptyStates/EmptyState';
import { FileCheck } from 'lucide-react';
import Skeleton from '../UI/Skeleton';

export default function CollectionReviews() {
  const { id: collectionId } = useParams<{ id: string }>();
  const { reviews, loading, loadReviews } = useRequestReviewStore();

  useEffect(() => {
    if (collectionId) {
      loadReviews(collectionId);
    }
  }, [collectionId, loadReviews]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Request Reviews
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Review requests in this collection
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No reviews yet"
          description="Request reviews will appear here"
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4"
            >
              <p className="font-semibold text-gray-900 dark:text-white">
                {review.request?.name || 'Unknown Request'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: {review.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
