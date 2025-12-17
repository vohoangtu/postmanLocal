/**
 * Collection Activity Component
 * Hiển thị activity logs cho collection
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useActivityStore } from '../../stores/activityStore';
import EmptyState from '../EmptyStates/EmptyState';
import { Activity } from 'lucide-react';
import Skeleton from '../UI/Skeleton';

export default function CollectionActivity() {
  const { id: collectionId } = useParams<{ id: string }>();
  const { activities, loading, loadCollectionActivities } = useActivityStore();

  useEffect(() => {
    if (collectionId) {
      loadCollectionActivities(collectionId);
    }
  }, [collectionId, loadCollectionActivities]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Activity
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Recent activity in this collection
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="card" height={80} />
          <Skeleton variant="card" height={80} />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Activity will appear here as you work"
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                  {activity.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">{activity.user?.name || 'Unknown'}</span>
                    {' '}
                    <span className="text-gray-600 dark:text-gray-400">{activity.action}</span>
                    {' '}
                    <span className="text-gray-600 dark:text-gray-400">{activity.entity_type}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
