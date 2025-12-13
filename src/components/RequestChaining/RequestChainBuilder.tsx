import { useState } from "react";
import { useRequestChainStore, RequestChain } from "../../stores/requestChainStore";
import { ChainStep, DataExtractor, Condition } from "../../services/requestChainService";
import Button from "../UI/Button";
import Input from "../UI/Input";
import Textarea from "../UI/Textarea";
import Card from "../UI/Card";
import Badge from "../UI/Badge";
import { useToast } from "../../hooks/useToast";
import { Plus, Trash2, GripVertical, Save, Edit, ArrowDown, Link2, Code } from "lucide-react";
import StepEditor from "./StepEditor";
import EmptyState from "../EmptyStates/EmptyState";

interface RequestChainBuilderProps {
  chainId?: string;
  onSave?: (chain: RequestChain) => void;
}

export default function RequestChainBuilder({ chainId, onSave }: RequestChainBuilderProps) {
  const { chains, addChain, updateChain, addStep, updateStep, deleteStep, reorderSteps } =
    useRequestChainStore();
  const [chainName, setChainName] = useState("");
  const [chainDescription, setChainDescription] = useState("");
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const toast = useToast();

  const handleAddStep = () => {
    const newStep: ChainStep = {
      id: `step-${Date.now()}`,
      name: `Step ${steps.length + 1}`,
      method: "GET",
      url: "",
      headers: {},
      extractors: [],
    };
    setSteps([...steps, newStep]);
    setEditingStepId(newStep.id);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<ChainStep>) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const handleEditStep = (step: ChainStep) => {
    setEditingStepId(step.id);
  };

  const handleSaveStep = (updatedStep: ChainStep) => {
    handleUpdateStep(updatedStep.id, updatedStep);
    setEditingStepId(null);
  };

  // Collect available variables từ các steps trước đó
  const getAvailableVariables = (stepIndex: number): string[] => {
    const vars = new Set<string>();
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      step.extractors.forEach((extractor) => {
        if (extractor.targetVariable) {
          vars.add(extractor.targetVariable);
        }
      });
    }
    return Array.from(vars);
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };


  const handleSave = () => {
    if (!chainName.trim()) {
      toast.error("Please enter a chain name");
      return;
    }

    if (steps.length === 0) {
      toast.error("Please add at least one step");
      return;
    }

    const chain: RequestChain = {
      id: chainId || `chain-${Date.now()}`,
      name: chainName,
      description: chainDescription,
      steps,
      variables: {},
    };

    if (chainId) {
      updateChain(chainId, chain);
    } else {
      addChain(chain);
    }

    onSave?.(chain);
    toast.success("Chain saved successfully");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Link2 size={20} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Request Chain Builder
        </h3>
      </div>

      <Card>
        <div className="space-y-3">
          <Input
            label="Chain Name"
            value={chainName}
            onChange={(e) => setChainName(e.target.value)}
            placeholder="e.g., User Authentication Flow"
            fullWidth
          />
          <Textarea
            label="Description (Optional)"
            value={chainDescription}
            onChange={(e) => setChainDescription(e.target.value)}
            placeholder="Describe what this chain does..."
            rows={2}
            fullWidth
          />
        </div>
      </Card>

      {steps.length === 0 ? (
        <Card>
          <EmptyState
            icon={Link2}
            title="No steps yet"
            description="Add steps to build your request chain"
            action={{
              label: "Add First Step",
              onClick: handleAddStep,
            }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => {
            const availableVars = getAvailableVariables(index);
            const isEditing = editingStepId === step.id;

            return (
              <div key={step.id}>
                <Card
                  hover
                  className="relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {step.name || `Step ${index + 1}`}
                          </h4>
                          {step.condition && step.condition.type !== "always" && (
                            <Badge variant="warning" size="sm">
                              Conditional
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="primary" size="sm" className="font-mono">
                            {step.method}
                          </Badge>
                          <span className="text-gray-700 dark:text-gray-300 truncate font-mono text-xs">
                            {step.url || "No URL set"}
                          </span>
                        </div>

                        {step.extractors.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Extracts:
                            </span>
                            {step.extractors.map((e, i) => (
                              <Badge key={i} variant="info" size="sm" className="font-mono">
                                {e.targetVariable || "unnamed"}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {availableVars.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Available:
                            </span>
                            {availableVars.map((v, i) => (
                              <Badge key={i} variant="success" size="sm" className="font-mono">
                                {`{{${v}}}`}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(step)}
                        title="Edit step"
                        aria-label="Edit step"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Delete step"
                        aria-label="Delete step"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown size={20} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                {isEditing && (
                  <div className="mt-2">
                    <StepEditor
                      step={step}
                      onSave={handleSaveStep}
                      onCancel={() => setEditingStepId(null)}
                      availableVariables={availableVars}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={handleAddStep} className="flex items-center gap-1.5">
          <Plus size={14} />
          Add Step
        </Button>
        <div className="flex-1" />
        <Button variant="primary" onClick={handleSave} className="flex items-center gap-1.5">
          <Save size={14} />
          Save Chain
        </Button>
      </div>
    </div>
  );
}


