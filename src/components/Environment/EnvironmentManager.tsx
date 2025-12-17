import { useState, useCallback, useMemo } from "react";
import { useEnvironmentStore } from "../../stores/environmentStore";
import Button from "../UI/Button";
import Input from "../UI/Input";
import Select from "../UI/Select";
import Modal from "../UI/Modal";
import Card from "../UI/Card";
import Badge from "../UI/Badge";
import PageLayout from "../Layout/PageLayout";
import PageToolbar from "../Layout/PageToolbar";
import { Plus, Trash2, Settings, CheckCircle2, X } from "lucide-react";

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

  const currentEnv = useMemo(
    () => environments.find((e) => e.id === activeEnvironment),
    [environments, activeEnvironment]
  );

  const environmentOptions = useMemo(() => [
    { value: "", label: "No Environment" },
    ...environments.map((env) => ({
      value: env.id,
      label: env.name,
    })),
  ], [environments]);

  const handleDeleteEnvironment = useCallback(() => {
    if (currentEnv && confirm(`Bạn có chắc muốn xóa environment "${currentEnv.name}"?`)) {
      deleteEnvironment(activeEnvironment!);
    }
  }, [currentEnv, activeEnvironment, deleteEnvironment]);

  const renderToolbar = useCallback(() => {
    return (
      <PageToolbar
        leftSection={
          <>
            <Settings size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Environments
            </h3>
            <Select
              value={activeEnvironment || ""}
              onChange={(e) => setActiveEnvironment(e.target.value || null)}
              options={environmentOptions}
              className="w-64"
            />
            {activeEnvironment && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteEnvironment}
                title="Xóa environment"
                aria-label="Delete environment"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </>
        }
        rightSection={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} />
            New Environment
          </Button>
        }
      />
    );
  }, [activeEnvironment, environmentOptions, handleDeleteEnvironment]);

  return (
    <>
      <PageLayout toolbar={renderToolbar()}>
        <div className="space-y-4">
          {currentEnv ? (
            <Card
              title="Environment Variables"
              subtitle={`${currentEnv.variables.filter((v) => v.enabled).length} active variables`}
            >
              <div className="space-y-3">
                {currentEnv.variables.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No variables yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newVars = [{ key: "", value: "", enabled: true }];
                        updateEnvironment(currentEnv.id, { variables: newVars });
                      }}
                      className="mt-2"
                    >
                      <Plus size={14} className="mr-1" />
                      Add First Variable
                    </Button>
                  </div>
                ) : (
                  <>
                    {currentEnv.variables.map((variable, index) => (
                      <div key={index} className="flex gap-2 items-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            const newVars = [...currentEnv.variables];
                            newVars[index].enabled = !newVars[index].enabled;
                            updateEnvironment(currentEnv.id, { variables: newVars });
                          }}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            variable.enabled
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          }`}
                          title={variable.enabled ? "Disable variable" : "Enable variable"}
                          aria-label={variable.enabled ? "Disable variable" : "Enable variable"}
                        >
                          {variable.enabled && <CheckCircle2 size={12} />}
                        </button>
                        <Input
                          value={variable.key}
                          onChange={(e) => {
                            const newVars = [...currentEnv.variables];
                            newVars[index].key = e.target.value;
                            updateEnvironment(currentEnv.id, { variables: newVars });
                          }}
                          placeholder="Variable name"
                          className="flex-1"
                        />
                        <Input
                          value={variable.value}
                          onChange={(e) => {
                            const newVars = [...currentEnv.variables];
                            newVars[index].value = e.target.value;
                            updateEnvironment(currentEnv.id, { variables: newVars });
                          }}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newVars = currentEnv.variables.filter((_, i) => i !== index);
                            updateEnvironment(currentEnv.id, { variables: newVars });
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Xóa variable"
                          aria-label="Delete variable"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newVars = [...currentEnv.variables, { key: "", value: "", enabled: true }];
                        updateEnvironment(currentEnv.id, { variables: newVars });
                      }}
                      className="w-full"
                    >
                      <Plus size={14} className="mr-1" />
                      Add Variable
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Settings size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Environment Selected
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Select an environment from the dropdown above or create a new one to manage variables.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 mx-auto"
                >
                  <Plus size={14} />
                  Create First Environment
                </Button>
              </div>
            </Card>
          )}
        </div>
      </PageLayout>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewEnvName("");
        }}
        title="Create New Environment"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setNewEnvName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateEnvironment}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Environment Name"
            value={newEnvName}
            onChange={(e) => setNewEnvName(e.target.value)}
            placeholder="e.g., Development, Staging, Production"
            fullWidth
            onKeyPress={(e) => e.key === "Enter" && handleCreateEnvironment()}
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Environment variables will be available for use in all requests within this environment.
          </p>
        </div>
      </Modal>
    </>
  );
}


