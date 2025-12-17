/**
 * Mock Server Settings Component
 * Full configuration cho Mock Server trong Settings
 */

import { useState, useEffect } from 'react';
import { Play, Square, Server, Plus, Trash2, HelpCircle, FileText, X } from 'lucide-react';
import { MockRoute } from '../../services/mockServerService';
import { webMockServerService } from '../../services/webMockServerService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../Loading/LoadingSpinner';
import MockResponseEditor from '../MockServer/MockResponseEditor';
import MockServerHelpModal from '../MockServer/MockServerHelpModal';
import { useSchemaStore } from '../../stores/schemaStore';
import { parseOpenAPISchema, validateOpenAPISchema } from '../../services/openApiParser';
import Button from '../UI/Button';
import Input from '../UI/Input';

export default function MockServerSettings() {
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
      if (error instanceof Error && error.message.includes("Tauri API")) {
        setIsRunning(false);
        return;
      }
      console.error("Failed to check mock server status:", error);
    }
  };

  const handleStart = async () => {
    if (routes.length === 0) {
      toast.warning("Vui lòng thêm ít nhất một route trước khi khởi động server");
      return;
    }

    setLoading(true);
    try {
      await webMockServerService.startMockServer(port, routes);
      setIsRunning(true);
      toast.success(`Mock server đã khởi động trên port ${port}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể khởi động mock server';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await webMockServerService.stopMockServer();
      setIsRunning(false);
      toast.success("Mock server đã dừng");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể dừng mock server';
      toast.error(errorMessage);
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
    
    // Nếu server đang chạy, sync route với service
    if (isRunning) {
      try {
        if (editingIndex >= 0) {
          await webMockServerService.stopMockServer();
          await webMockServerService.startMockServer(port, updatedRoutes);
          setIsRunning(true);
        } else {
          await webMockServerService.addMockRoute(route);
        }
        toast.success("Route đã được lưu và đồng bộ");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể đồng bộ route';
        toast.error(errorMessage);
      }
    } else {
      toast.success("Route đã được lưu");
    }
  };

  const handleDeleteRoute = (index: number) => {
    setRoutes(routes.filter((_, i) => i !== index));
    toast.success("Route đã được xóa");
  };

  const handleImportFromSchema = (schemaId: string) => {
    const schema = schemas.find((s) => s.id === schemaId);
    if (!schema) {
      toast.error("Schema không tồn tại");
      return;
    }

    try {
      const validation = validateOpenAPISchema(schema.schemaData);
      if (!validation.valid) {
        toast.error(`Schema không hợp lệ: ${validation.errors.join(", ")}`);
        return;
      }

      const generatedRoutes = parseOpenAPISchema(schema.schemaData);
      if (generatedRoutes.length === 0) {
        toast.warning("Schema không có paths nào để generate routes");
        return;
      }

      setPreviewRoutes(generatedRoutes);
      setShowSchemaImport(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi parse schema';
      toast.error(`Lỗi khi parse schema: ${errorMessage}`);
    }
  };

  const handleApplyPreviewRoutes = () => {
    const existingKeys = new Set(routes.map((r) => `${r.method}:${r.path}`));
    const newRoutes = previewRoutes.filter(
      (r) => !existingKeys.has(`${r.method}:${r.path}`)
    );

    setRoutes([...routes, ...newRoutes]);
    setShowSchemaImport(false);
    setPreviewRoutes([]);
    toast.success(`Đã thêm ${newRoutes.length} routes từ schema`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mock Server
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Cấu hình Mock Server để test API requests
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 space-y-6">
        {/* Server Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Control
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
                  className="flex items-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Play size={16} />}
                  Khởi động
                </Button>
              </>
            ) : (
              <Button
                variant="danger"
                onClick={handleStop}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : <Square size={16} />}
                Dừng
              </Button>
            )}
          </div>
        </div>

        {isRunning && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <p className="text-sm text-green-800 dark:text-green-200">
              Server đang chạy trên <code className="font-mono">http://localhost:{port}</code>
            </p>
          </div>
        )}

        {/* Routes Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Routes</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json,.yaml,.yml";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;

                    try {
                      const text = await file.text();
                      let schemaData: any;

                      if (file.name.endsWith(".json")) {
                        schemaData = JSON.parse(text);
                      } else {
                        toast.error("Chỉ hỗ trợ file JSON. YAML sẽ được hỗ trợ trong tương lai.");
                        return;
                      }

                      const validation = validateOpenAPISchema(schemaData);
                      if (!validation.valid) {
                        toast.error(`Schema không hợp lệ: ${validation.errors.join(", ")}`);
                        return;
                      }

                      const generatedRoutes = parseOpenAPISchema(schemaData);
                      if (generatedRoutes.length === 0) {
                        toast.warning("Schema không có paths nào để generate routes");
                        return;
                      }

                      setPreviewRoutes(generatedRoutes);
                      setShowSchemaImport(true);
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi đọc file';
                      toast.error(`Lỗi khi đọc file: ${errorMessage}`);
                    }
                  };
                  input.click();
                }}
                className="flex items-center gap-1"
              >
                <FileText size={14} />
                Import File
              </Button>
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
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddRoute}
                className="flex items-center gap-1"
              >
                <Plus size={14} />
                Thêm Route
              </Button>
            </div>
          </div>

          {routes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Chưa có routes nào được cấu hình. Thêm route để bắt đầu.
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
                      Sửa
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
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSchemaImport(false);
                  setPreviewRoutes([]);
                }}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleApplyPreviewRoutes}
              >
                Áp dụng Routes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
