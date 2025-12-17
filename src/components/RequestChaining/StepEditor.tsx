import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { ChainStep, DataExtractor, Condition } from "../../services/requestChainService";
import Button from "../UI/Button";

interface StepEditorProps {
  step: ChainStep;
  onSave: (step: ChainStep) => void;
  onCancel: () => void;
  availableVariables: string[];
}

export default function StepEditor({
  step,
  onSave,
  onCancel,
  availableVariables,
}: StepEditorProps) {
  const [editedStep, setEditedStep] = useState<ChainStep>({ 
    ...step,
    extractors: step.extractors || []
  });

  const handleAddExtractor = () => {
    const newExtractor: DataExtractor = {
      id: `extractor-${Date.now()}`,
      source: "response_body",
      path: "",
      targetVariable: "",
    };
    setEditedStep({
      ...editedStep,
      extractors: [...editedStep.extractors, newExtractor],
    });
  };

  const handleUpdateExtractor = (extractorId: string, updates: Partial<DataExtractor>) => {
    setEditedStep({
      ...editedStep,
      extractors: editedStep.extractors.map((e) =>
        e.id === extractorId ? { ...e, ...updates } : e
      ),
    });
  };

  const handleDeleteExtractor = (extractorId: string) => {
    setEditedStep({
      ...editedStep,
      extractors: editedStep.extractors.filter((e) => e.id !== extractorId),
    });
  };

  const handleUpdateCondition = (condition: Condition | undefined) => {
    setEditedStep({ ...editedStep, condition });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Step: {editedStep.name}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Step Name
            </label>
            <input
              type="text"
              value={editedStep.name}
              onChange={(e) => setEditedStep({ ...editedStep, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Request Config */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Method
              </label>
              <select
                value={editedStep.method}
                onChange={(e) => setEditedStep({ ...editedStep, method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {`URL (có thể dùng {{variable}})`}
              </label>
              <input
                type="text"
                value={editedStep.url}
                onChange={(e) => setEditedStep({ ...editedStep, url: e.target.value })}
                placeholder="https://api.example.com/users/{{userId}}"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {availableVariables.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Available Variables
              </label>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Headers (JSON)
            </label>
            <textarea
              value={JSON.stringify(editedStep.headers, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditedStep({ ...editedStep, headers: parsed });
                } catch {
                  // Invalid JSON
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              rows={4}
            />
          </div>

          {/* Body */}
          {(editedStep.method === "POST" ||
            editedStep.method === "PUT" ||
            editedStep.method === "PATCH") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {`Request Body (có thể dùng {{variable}})`}
              </label>
              <textarea
                value={editedStep.body || ""}
                onChange={(e) => setEditedStep({ ...editedStep, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={6}
              />
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Condition (khi nào chạy step này)
            </label>
            <select
              value={editedStep.condition?.type || "always"}
              onChange={(e) => {
                const type = e.target.value as Condition["type"];
                if (type === "always") {
                  handleUpdateCondition(undefined);
                } else {
                  handleUpdateCondition({
                    type,
                    value: editedStep.condition?.value,
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="always">Luôn chạy</option>
              <option value="status_code">Khi status code = giá trị</option>
              <option value="response_contains">Khi response chứa text</option>
            </select>
            {editedStep.condition && editedStep.condition.type !== "always" && (
              <input
                type="text"
                value={editedStep.condition.value || ""}
                onChange={(e) =>
                  handleUpdateCondition({
                    ...editedStep.condition!,
                    value: e.target.value,
                  })
                }
                placeholder={
                  editedStep.condition.type === "status_code" ? "200" : "text to search"
                }
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            )}
          </div>

          {/* Extractors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Extractors
              </label>
              <Button variant="ghost" size="sm" onClick={handleAddExtractor}>
                <Plus size={14} className="mr-1" />
                Add Extractor
              </Button>
            </div>

            {editedStep.extractors.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Chưa có extractor nào. Thêm extractor để lấy dữ liệu từ response.
              </p>
            ) : (
              <div className="space-y-2">
                {editedStep.extractors.map((extractor) => (
                  <div
                    key={extractor.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Source
                        </label>
                        <select
                          value={extractor.source}
                          onChange={(e) =>
                            handleUpdateExtractor(extractor.id, {
                              source: e.target.value as DataExtractor["source"],
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="response_body">Response Body</option>
                          <option value="response_header">Response Header</option>
                          <option value="response_status">Status Code</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Path (JSONPath hoặc header name)
                        </label>
                        <input
                          type="text"
                          value={extractor.path}
                          onChange={(e) =>
                            handleUpdateExtractor(extractor.id, { path: e.target.value })
                          }
                          placeholder={
                            extractor.source === "response_body"
                              ? "data.user.id"
                              : extractor.source === "response_header"
                              ? "X-Token"
                              : ""
                          }
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Variable Name
                        </label>
                        <input
                          type="text"
                          value={extractor.targetVariable}
                          onChange={(e) =>
                            handleUpdateExtractor(extractor.id, {
                              targetVariable: e.target.value,
                            })
                          }
                          placeholder="userId"
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExtractor(extractor.id)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      <Trash2 size={12} className="inline mr-1" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => onSave(editedStep)}>
              Save Step
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
