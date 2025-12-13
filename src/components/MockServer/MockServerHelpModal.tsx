/**
 * Modal hướng dẫn sử dụng Mock Server
 */

import { X, Info, Code, Globe, Server } from "lucide-react";
import Button from "../UI/Button";

interface MockServerHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MockServerHelpModal({ isOpen, onClose }: MockServerHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Hướng dẫn sử dụng Mock Server
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Giới thiệu */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Mock Server là gì?
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Mock Server cho phép bạn tạo một server giả lập để test API mà không cần backend thật. 
              Server sẽ chạy trên localhost và trả về các response được định nghĩa sẵn.
            </p>
          </div>

          {/* Cách khai báo URL */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Cách khai báo URL trong Request
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  1. Mock Server mặc định chạy trên port 3000:
                </p>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                  http://localhost:3000
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  2. Khi tạo route, bạn cần khai báo path. Ví dụ:
                </p>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 space-y-2">
                  <div className="font-mono text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Path:</span>{" "}
                    <span className="text-gray-900 dark:text-gray-100">/api/users</span>
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Method:</span>{" "}
                    <span className="text-gray-900 dark:text-gray-100">GET</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  3. Trong Request Builder, sử dụng URL đầy đủ:
                </p>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                  http://localhost:3000/api/users
                </div>
              </div>
            </div>
          </div>

          {/* Ví dụ */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Ví dụ sử dụng
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bước 1: Tạo Route trong Mock Server
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-2">
                  <li>Path: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/api/users</code></li>
                  <li>Method: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">GET</code></li>
                  <li>Status: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">200</code></li>
                  <li>Body: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{"{ \"users\": [] }"}</code></li>
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bước 2: Start Mock Server
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Click nút "Start" để khởi động server trên port đã chọn (mặc định 3000).
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bước 3: Test trong Request Builder
                </p>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                  Method: GET<br />
                  URL: http://localhost:3000/api/users
                </div>
              </div>
            </div>
          </div>

          {/* Lưu ý */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              ⚠️ Lưu ý quan trọng:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li><strong>Desktop (Tauri):</strong> Mock Server chạy HTTP server thật trên localhost</li>
              <li><strong>Web Browser:</strong> Sử dụng Service Worker để intercept requests (chỉ hoạt động với localhost)</li>
              <li>Đảm bảo port không bị conflict với các service khác</li>
              <li>URL phải khớp chính xác với path đã khai báo trong route</li>
              <li>Method (GET, POST, etc.) phải khớp với route</li>
              <li>Trên web, chỉ có thể mock requests đến localhost (không thể mock external URLs)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="primary" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </div>
  );
}

