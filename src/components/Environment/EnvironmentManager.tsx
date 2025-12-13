import { useState } from "react";
import { useEnvironmentStore } from "../../stores/environmentStore";
import Button from "../UI/Button";

export default function EnvironmentManager() {
  const {
    environments,
    activeEnvironment,
    setActiveEnvironment,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
  } = useEnvironmentStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");

  const handleCreateEnvironment = () => {
    if (!newEnvName.trim()) return;

    const newEnv = {
      id: Date.now().toString(),
      name: newEnvName,
      variables: [{ key: "", value: "", enabled: true }],
    };

    addEnvironment(newEnv);
    setNewEnvName("");
    setShowCreateModal(false);
  };

  const currentEnv = environments.find((e) => e.id === activeEnvironment);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Environments
        </h3>
        <Button
          variant="link"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          + New
        </Button>
      </div>

      <div className="flex gap-2">
        <select
          value={activeEnvironment || ""}
          onChange={(e) => setActiveEnvironment(e.target.value || null)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">No Environment</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>
        {activeEnvironment && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa environment "${currentEnv?.name}"?`)) {
                deleteEnvironment(activeEnvironment);
              }
            }}
            title="Xóa environment"
          >
            ×
          </Button>
        )}
      </div>

      {currentEnv && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Variables
          </h4>
          {currentEnv.variables.map((variable, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={variable.enabled}
                onChange={(e) => {
                  const newVars = [...currentEnv.variables];
                  newVars[index].enabled = e.target.checked;
                  updateEnvironment(currentEnv.id, { variables: newVars });
                }}
                className="w-4 h-4"
              />
              <input
                type="text"
                value={variable.key}
                onChange={(e) => {
                  const newVars = [...currentEnv.variables];
                  newVars[index].key = e.target.value;
                  updateEnvironment(currentEnv.id, { variables: newVars });
                }}
                placeholder="Variable name"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={variable.value}
                onChange={(e) => {
                  const newVars = [...currentEnv.variables];
                  newVars[index].value = e.target.value;
                  updateEnvironment(currentEnv.id, { variables: newVars });
                }}
                placeholder="Value"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => {
                  const newVars = currentEnv.variables.filter((_, i) => i !== index);
                  updateEnvironment(currentEnv.id, { variables: newVars });
                }}
                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Xóa variable"
              >
                ×
              </button>
            </div>
          ))}
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              const newVars = [...currentEnv.variables, { key: "", value: "", enabled: true }];
              updateEnvironment(currentEnv.id, { variables: newVars });
            }}
          >
            + Add Variable
          </Button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Environment
            </h3>
            <input
              type="text"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="Environment name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && handleCreateEnvironment()}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateEnvironment}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


