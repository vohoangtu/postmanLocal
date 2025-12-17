/**
 * Version Diff Viewer
 * Hiển thị diff giữa các versions
 */

import { Plus, Minus, Edit2 } from 'lucide-react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { VersionDiff } from '../../stores/apiVersionStore';

interface DiffViewerProps {
  diff: VersionDiff[];
  current?: any;
  previous?: any;
}

export default function VersionDiffViewer({ diff, current, previous }: DiffViewerProps) {
  if (!diff || diff.length === 0) {
    return (
      <Card>
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          No changes detected
        </div>
      </Card>
    );
  }

  return (
    <Card title="Changes">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {diff.map((change, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${
              change.type === 'added'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : change.type === 'removed'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
            }`}
          >
            <div className="flex items-start gap-2">
              {change.type === 'added' && (
                <Plus
                  size={16}
                  className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                />
              )}
              {change.type === 'removed' && (
                <Minus
                  size={16}
                  className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                />
              )}
              {change.type === 'modified' && (
                <Edit2
                  size={16}
                  className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {change.path}
                  </code>
                  <Badge
                    variant={
                      change.type === 'added'
                        ? 'success'
                        : change.type === 'removed'
                        ? 'error'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {change.type}
                  </Badge>
                </div>
                {change.type === 'added' && (
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(change.value, null, 2)}
                    </pre>
                  </div>
                )}
                {change.type === 'removed' && (
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(change.value, null, 2)}
                    </pre>
                  </div>
                )}
                {change.type === 'modified' && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="text-red-700 dark:text-red-300 mb-1">Old:</div>
                      <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(change.old_value, null, 2)}
                      </pre>
                    </div>
                    <div className="text-sm">
                      <div className="text-green-700 dark:text-green-300 mb-1">New:</div>
                      <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(change.new_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
