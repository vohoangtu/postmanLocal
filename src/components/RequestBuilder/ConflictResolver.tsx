/**
 * Conflict Resolver Component
 * Resolve conflicts khi có concurrent edits
 */

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import { AlertTriangle, CheckCircle2, XCircle, GitMerge } from 'lucide-react';
import Badge from '../UI/Badge';

interface Conflict {
  field: string;
  currentValue: string;
  incomingValue: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (resolutions: Record<string, string>) => void;
  onCancel: () => void;
}

export default function ConflictResolver({ conflicts, onResolve, onCancel }: ConflictResolverProps) {
  const { user } = useAuth();
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const handleResolve = (field: string, value: string) => {
    setResolutions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    onResolve(resolutions);
  };

  const handleUseCurrent = () => {
    const currentResolutions: Record<string, string> = {};
    conflicts.forEach((conflict) => {
      currentResolutions[conflict.field] = conflict.currentValue;
    });
    onResolve(currentResolutions);
  };

  const handleUseIncoming = () => {
    const incomingResolutions: Record<string, string> = {};
    conflicts.forEach((conflict) => {
      incomingResolutions[conflict.field] = conflict.incomingValue;
    });
    onResolve(incomingResolutions);
  };

  return (
    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-300 dark:border-orange-700">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
        <h3 className="font-bold text-orange-900 dark:text-orange-200">
          Conflict Detected
        </h3>
      </div>

      <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">
        Another user has made changes to this request. Please resolve the conflicts:
      </p>

      <div className="space-y-3 mb-4">
        {conflicts.map((conflict) => (
          <div
            key={conflict.field}
            className="p-3 bg-white dark:bg-gray-800 rounded border-2 border-orange-300 dark:border-orange-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {conflict.field}
              </span>
              <Badge variant="warning" size="sm">
                Conflict
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  Your version (current):
                </div>
                <div className="text-sm text-gray-900 dark:text-white font-mono">
                  {conflict.currentValue || '(empty)'}
                </div>
              </div>

              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                  Incoming version from {conflict.user.name}:
                </div>
                <div className="text-sm text-gray-900 dark:text-white font-mono">
                  {conflict.incomingValue || '(empty)'}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(conflict.field, conflict.currentValue)}
                  className={`flex-1 ${
                    resolutions[conflict.field] === conflict.currentValue
                      ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                      : ''
                  }`}
                >
                  Keep Mine
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(conflict.field, conflict.incomingValue)}
                  className={`flex-1 ${
                    resolutions[conflict.field] === conflict.incomingValue
                      ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                      : ''
                  }`}
                >
                  Use Theirs
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={handleUseCurrent} className="flex-1">
          Keep All Mine
        </Button>
        <Button variant="secondary" onClick={handleUseIncoming} className="flex-1">
          Use All Theirs
        </Button>
        <Button variant="primary" onClick={handleApply} className="flex-1 flex items-center gap-2">
          <GitMerge size={16} />
          Apply Resolutions
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
