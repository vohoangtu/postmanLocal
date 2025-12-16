/**
 * Step Welcome Component
 * Bước 1: Chào mừng và giới thiệu tổng quan
 */

import { Sparkles } from 'lucide-react';

export default function StepWelcome() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Chào mừng đến với PostmanLocal!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        PostmanLocal là công cụ mạnh mẽ để test và quản lý API requests. 
        Hãy cùng khám phá các tính năng chính trong vài phút!
      </p>
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Mẹo:</strong> Bạn có thể bỏ qua hướng dẫn bất cứ lúc nào, 
          nhưng chúng tôi khuyên bạn nên hoàn thành để hiểu rõ hơn về các tính năng.
        </p>
      </div>
    </div>
  );
}
