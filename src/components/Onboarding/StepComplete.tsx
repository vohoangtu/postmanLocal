/**
 * Step Complete Component
 * Bước 5: Hoàn thành onboarding
 */

import { CheckCircle, Rocket } from 'lucide-react';

export default function StepComplete() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Hoàn thành!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Bạn đã hoàn thành hướng dẫn. Bây giờ bạn có thể sử dụng tất cả các tính năng của PostmanLocal!
      </p>
      <div className="mt-8 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
        <Rocket className="w-5 h-5" />
        <span className="font-semibold">Sẵn sàng để bắt đầu!</span>
      </div>
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-300">
          ✨ Tất cả các tính năng đã được mở khóa. Hãy khám phá và tận hưởng!
        </p>
      </div>
    </div>
  );
}
