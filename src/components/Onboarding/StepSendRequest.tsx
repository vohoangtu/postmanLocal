/**
 * Step Send Request Component
 * Bước 3: Hướng dẫn gửi request và xem response
 */

import { Send, CheckCircle } from 'lucide-react';

export default function StepSendRequest() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
          <Send className="w-12 h-12 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Gửi Request và xem Response
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Sau khi nhập URL và chọn method (GET, POST, etc.), 
        click nút <strong>"Send"</strong> để gửi request. 
        Response sẽ hiển thị ở bên phải với status code, headers và body.
      </p>
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Status: <span className="font-mono text-green-600 dark:text-green-400">200 OK</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Headers và Body sẽ hiển thị chi tiết
          </span>
        </div>
      </div>
    </div>
  );
}
