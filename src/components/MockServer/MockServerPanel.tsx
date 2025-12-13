import { useState, useEffect } from "react";
import { Play, Square, Server, Plus, Trash2, HelpCircle } from "lucide-react";
import { mockServerService, MockRoute } from "../../services/mockServerService";
import { useToast } from "../../hooks/useToast";
import LoadingSpinner from "../Loading/LoadingSpinner";
import MockResponseEditor from "./MockResponseEditor";
import MockServerHelpModal from "./MockServerHelpModal";

export default function MockServerPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState(3000);
  const [routes, setRoutes] = useState<MockRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRoute, setEditingRoute] = useState<MockRoute | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
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
          <button
            onClick={handleAddRoute}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Route
          </button>
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
    </div>
  );
}

