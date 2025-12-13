import { useState } from "react";
import Button from "../UI/Button";
import { AlertTriangle, Check, X } from "lucide-react";

interface Conflict {
  id: string;
  field: string;
  localValue: any;
  remoteValue: any;
  remoteUser: {
    id: string;
    name: string;
  };
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: "local" | "remote" | "merge") => void;
  onCancel: () => void;
}

export default function ConflictResolver({
  conflicts,
  onResolve,
  onCancel,
}: ConflictResolverProps) {
  const [resolutions, setResolutions] = useState<Map<string, "local" | "remote" | "merge">>(
    new Map()
  );

  const handleResolve = (conflictId: string, resolution: "local" | "remote" | "merge") => {
    setResolutions((prev) => new Map(prev).set(conflictId, resolution));
    onResolve(conflictId, resolution);
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-yellow-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conflict Resolution
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Multiple users have edited this content. Please choose how to resolve each conflict.
        </p>

        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {conflict.field}
              </h4>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your version:</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {typeof conflict.localValue === "object"
                      ? JSON.stringify(conflict.localValue, null, 2)
                      : String(conflict.localValue)}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {conflict.remoteUser.name}'s version:
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {typeof conflict.remoteValue === "object"
                      ? JSON.stringify(conflict.remoteValue, null, 2)
                      : String(conflict.remoteValue)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleResolve(conflict.id, "local")}
                >
                  <Check size={14} className="mr-1" />
                  Keep Mine
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleResolve(conflict.id, "remote")}
                >
                  Use Theirs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(conflict.id, "merge")}
                >
                  Merge
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}


