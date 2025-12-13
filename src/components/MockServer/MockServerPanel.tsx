import { useState, useEffect } from "react";
import { Play, Square, Server, Plus, Trash2, HelpCircle, FileText, X } from "lucide-react";
import { mockServerService, MockRoute } from "../../services/mockServerService";
import { useToast } from "../../hooks/useToast";
import LoadingSpinner from "../Loading/LoadingSpinner";
import MockResponseEditor from "./MockResponseEditor";
import MockServerHelpModal from "./MockServerHelpModal";
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
      const status = await mockServerService.getMockServerStatus();
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
      await mockServerService.startMockServer(port, routes);
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
      await mockServerService.stopMockServer();
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
          await mockServerService.stopMockServer();
          await mockServerService.startMockServer(port, updatedRoutes);
          setIsRunning(true);
        } else {
          await mockServerService.addMockRoute(route);
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5" />
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
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 3000)}
                className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Port"
                disabled={isRunning}
              />
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? <LoadingSpinner size="sm" /> : <Play className="w-4 h-4" />}
                Start
              </button>
            </>
          ) : (
            <button
              onClick={handleStop}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Square className="w-4 h-4" />}
              Stop
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
          <p className="text-sm text-green-800 dark:text-green-200">
            Server running on <code className="font-mono">http://localhost:{port}</code>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Routes</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportFromFile}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              title="Import từ OpenAPI file"
            >
              <FileText className="w-4 h-4" />
              Import File
            </button>
            {schemas.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleImportFromSchema(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                defaultValue=""
              >
                <option value="">Import từ Schema...</option>
                {schemas.map((schema) => (
                  <option key={schema.id} value={schema.id}>
                    {schema.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleAddRoute}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Route
            </button>
          </div>
        </div>

        {routes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No routes configured. Add a route to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {routes.map((route, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {route.method} {route.path}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    Status: {route.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRoute(route)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoute(index)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}

