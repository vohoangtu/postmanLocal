/**
 * Step Explore Features Component
 * Bước 4: Giới thiệu các tính năng chính
 */

import { Layers, Globe, RefreshCw, FileCode } from 'lucide-react';

export default function StepExploreFeatures() {
  const features = [
    { icon: Layers, name: 'Collections', desc: 'Tổ chức và quản lý requests' },
    { icon: Globe, name: 'Environments', desc: 'Quản lý biến môi trường' },
    { icon: RefreshCw, name: 'Sync', desc: 'Đồng bộ dữ liệu giữa các thiết bị' },
    { icon: FileCode, name: 'Templates', desc: 'Sử dụng templates có sẵn' },
  ];

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
          <Layers className="w-12 h-12 text-orange-600 dark:text-orange-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Khám phá các tính năng
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Sau khi hoàn thành hướng dẫn, bạn sẽ có thể sử dụng các tính năng nâng cao:
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="font-semibold text-sm text-gray-900 dark:text-white">
                {feature.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {feature.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
