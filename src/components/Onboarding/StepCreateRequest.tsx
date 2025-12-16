/**
 * Step Create Request Component
 * Bước 2: Hướng dẫn tạo request đầu tiên
 */

import { FileText, ArrowRight } from 'lucide-react';

export default function StepCreateRequest() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
          <FileText className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Tạo Request đầu tiên
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Bắt đầu bằng cách tạo một API request đơn giản. 
        Click vào nút <strong>"New Request"</strong> ở góc trên bên trái để bắt đầu.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>New Request</span>
        <ArrowRight className="w-4 h-4" />
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
          GET
        </span>
        <ArrowRight className="w-4 h-4" />
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
          https://api.example.com
        </span>
      </div>
    </div>
  );
}
