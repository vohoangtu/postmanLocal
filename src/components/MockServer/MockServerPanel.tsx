import { useState, useEffect, useCallback, useMemo } from "react";
import { Play, Square, Server, Plus, HelpCircle, FileText, X } from "lucide-react";
import { MockRoute } from "../../services/mockServerService";
import { webMockServerService } from "../../services/webMockServerService";
import { useToast } from "../../hooks/useToast";
import LoadingSpinner from "../Loading/LoadingSpinner";
import MockResponseEditor from "./MockResponseEditor";
import MockServerHelpModal from "./MockServerHelpModal";
import MockRouteCard from "./MockRouteCard";
import PageLayout from "../Layout/PageLayout";
import PageToolbar from "../Layout/PageToolbar";
import Button from "../UI/Button";
import Input from "../UI/Input";
import Select from "../UI/Select";
import EmptyState from "../EmptyStates/EmptyState";
import { useSchemaStore } from "../../stores/schemaStore";
import { parseOpenAPISchema, validateOpenAPISchema } from "../../services/openApiParser";

export default function MockServerPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState(3000);
  const [routes, setRoutes] = useState<MockRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRoute, setEditingRoute] = useState<MockRoute | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSchemaImport, setShowSchemaImport] = useState(false);
  const [previewRoutes, setPreviewRoutes] = useState<MockRoute[]>([]);
  const { schemas } = useSchemaStore();
  const toast = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await webMockServerService.getMockServerStatus();
      setIsRunning(status.running);
      if (status.port) setPort(status.port);
    } catch (error) {
      // Silently handle errors in web environment
      if (error instanceof Error && error.message.includes("Tauri API")) {
        setIsRunning(false);
        return;
      }
      console.error("Failed to check mock server status:", error);
    }
  };

  const handleStart = async () => {
    if (routes.length === 0) {
      toast.warning("Please add at least one route before starting the server");
      return;
    }

    setLoading(true);
    try {
      await webMockServerService.startMockServer(port, routes);
      setIsRunning(true);
      toast.success(`Mock server started on port ${port}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start mock server");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await webMockServerService.stopMockServer();
      setIsRunning(false);
      toast.success("Mock server stopped");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop mock server");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = () => {
    const newRoute: MockRoute = {
      path: "/api/example",
      method: "GET",
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { message: "Mock response" },
      delayMs: 0,
    };
    setEditingRoute(newRoute);
  };

  const handleSaveRoute = async (route: MockRoute) => {
    const editingIndex = editingRoute ? routes.findIndex((r) => r === editingRoute) : -1;
    const updatedRoutes = editingIndex >= 0
      ? routes.map((r, i) => (i === editingIndex ? route : r))
      : [...routes, route];
    
    setRoutes(updatedRoutes);
    setEditingRoute(null);
    
    // If server is running, sync the route with the service
    if (isRunning) {
      try {
        if (editingIndex >= 0) {
          // Update existing route - need to remove old and add new
          // For simplicity, we'll just restart with updated routes
          await webMockServerService.stopMockServer();
          await webMockServerService.startMockServer(port, updatedRoutes);
          setIsRunning(true);
        } else {
          await webMockServerService.addMockRoute(route);
        }
        toast.success("Route saved and synced");
      } catch (error: any) {
        toast.error(error.message || "Failed to sync route");
      }
    } else {
      toast.success("Route saved");
    }
  };

  const handleDeleteRoute = (index: number) => {
    setRoutes(routes.filter((_, i) => i !== index));
    toast.success("Route deleted");
  };

  const handleImportFromSchema = (schemaId: string) => {
    const schema = schemas.find((s) => s.id === schemaId);
    if (!schema) {
      toast.error("Schema không tồn tại");
      return;
    }

    try {
      // Validate schema
      const validation = validateOpenAPISchema(schema.schemaData);
      if (!validation.valid) {
        toast.error(`Schema không hợp lệ: ${validation.errors.join(", ")}`);
        return;
      }

      // Parse và generate routes
      const generatedRoutes = parseOpenAPISchema(schema.schemaData);
      if (generatedRoutes.length === 0) {
        toast.warning("Schema không có paths nào để generate routes");
        return;
      }

      setPreviewRoutes(generatedRoutes);
      setShowSchemaImport(true);
    } catch (error: any) {
      toast.error(`Lỗi khi parse schema: ${error.message}`);
    }
  };

  const handleApplyPreviewRoutes = () => {
    // Merge preview routes với routes hiện tại (tránh duplicate)
    const existingKeys = new Set(routes.map((r) => `${r.method}:${r.path}`));
    const newRoutes = previewRoutes.filter(
      (r) => !existingKeys.has(`${r.method}:${r.path}`)
    );

    setRoutes([...routes, ...newRoutes]);
    setShowSchemaImport(false);
    setPreviewRoutes([]);
    toast.success(`Đã thêm ${newRoutes.length} routes từ schema`);
  };

  const handleImportFromFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.yaml,.yml";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        let schemaData: any;

        // Parse JSON hoặc YAML
        if (file.name.endsWith(".json")) {
          schemaData = JSON.parse(text);
        } else {
          // YAML - cần thư viện yaml parser, tạm thời chỉ hỗ trợ JSON
          toast.error("Chỉ hỗ trợ file JSON. YAML sẽ được hỗ trợ trong tương lai.");
          return;
        }

        // Validate
        const validation = validateOpenAPISchema(schemaData);
        if (!validation.valid) {
          toast.error(`Schema không hợp lệ: ${validation.errors.join(", ")}`);
          return;
        }

        // Parse và generate routes
        const generatedRoutes = parseOpenAPISchema(schemaData);
        if (generatedRoutes.length === 0) {
          toast.warning("Schema không có paths nào để generate routes");
          return;
        }

        setPreviewRoutes(generatedRoutes);
        setShowSchemaImport(true);
      } catch (error: any) {
        toast.error(`Lỗi khi đọc file: ${error.message}`);
      }
    };
    input.click();
  };

  const schemaOptions = useMemo(() => {
    return schemas.map((schema) => ({ value: schema.id, label: schema.name }));
  }, [schemas]);

  const handleEditRoute = useCallback((route: MockRoute) => {
    setEditingRoute(route);
  }, []);

  const renderToolbar = useCallback(() => {
    return (
      <PageToolbar
        leftSection={
          <>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mock Server
              </h2>
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Hướng dẫn sử dụng Mock Server"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
            {isRunning && (
              <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <p className="text-xs text-green-800 dark:text-green-200">
                  Running on <code className="font-mono">http://localhost:{port}</code>
                </p>
              </div>
            )}
            {!isRunning && (
              <>
                <Input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 3000)}
                  placeholder="Port"
                  disabled={isRunning}
                  className="w-24"
                />
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={loading || routes.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Play className="w-4 h-4" />}
                  Start
                </Button>
              </>
            )}
            {isRunning && (
              <Button
                variant="primary"
                onClick={handleStop}
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                {loading ? <LoadingSpinner size="sm" /> : <Square className="w-4 h-4" />}
                Stop
              </Button>
            )}
          </>
        }
        rightSection={
          <>
            <Button
              variant="ghost"
              onClick={handleImportFromFile}
              className="flex items-center gap-1 bg-purple-600 text-white hover:bg-purple-700"
              title="Import từ OpenAPI file"
            >
              <FileText className="w-4 h-4" />
              Import File
            </Button>
            {schemas.length > 0 && (
              <Select
                onChange={(e) => {
                  if (e.target.value) {
                    handleImportFromSchema(e.target.value);
                    e.target.value = "";
                  }
                }}
                options={[
                  { value: "", label: "Import từ Schema..." },
                  ...schemaOptions
                ]}
                defaultValue=""
                className="w-48"
              />
            )}
            <Button
              variant="primary"
              onClick={handleAddRoute}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Route
            </Button>
          </>
        }
      />
    );
  }, [isRunning, port, loading, routes.length, schemas.length, schemaOptions, handleStart, handleStop, handleImportFromFile, handleImportFromSchema]);

  return (
    <>
      <PageLayout toolbar={renderToolbar()}>
        {/* Routes Grid */}
        {routes.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No routes configured"
            description="Add a route to get started with your mock server"
            action={{
              label: "Add First Route",
              onClick: handleAddRoute,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route, index) => (
              <MockRouteCard
                key={index}
                route={route}
                index={index}
                onEdit={handleEditRoute}
                onDelete={handleDeleteRoute}
              />
            ))}
          </div>
        )}
      </PageLayout>

      {editingRoute && (
        <MockResponseEditor
          route={editingRoute}
          onSave={handleSaveRoute}
          onCancel={() => setEditingRoute(null)}
        />
      )}

      <MockServerHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Schema Import Preview Modal */}
      {showSchemaImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preview Routes từ Schema
              </h3>
              <button
                onClick={() => {
                  setShowSchemaImport(false);
                  setPreviewRoutes([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Đã tìm thấy {previewRoutes.length} routes. Chọn các routes bạn muốn thêm:
            </p>

            <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
              {previewRoutes.map((route, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {route.method} {route.path}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        Status: {route.status}
                      </span>
                    </div>
                  </div>
                  {route.body && (
                    <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {JSON.stringify(route.body, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSchemaImport(false);
                  setPreviewRoutes([]);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPreviewRoutes}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Routes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

