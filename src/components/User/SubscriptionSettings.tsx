/**
 * User Subscription Settings Component
 * Quản lý subscription (nếu có)
 */

export default function SubscriptionSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý subscription của bạn
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Tính năng subscription sẽ được triển khai trong tương lai.
        </p>
      </div>
    </div>
  );
}
