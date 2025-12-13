import { isTauri } from "../utils/platform";
import { webMockServerService } from "./webMockServerService";

export interface MockRoute {
  path: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body: any;
  delayMs: number;
}

async function getInvoke() {
  if (!isTauri()) {
    throw new Error("Tauri API is not available in web environment");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke;
}

export async function startMockServer(port: number, routes: MockRoute[]): Promise<void> {
  if (!isTauri()) {
    // Use Service Worker for web environment
    return await webMockServerService.startMockServer(port, routes);
  }
  const invoke = await getInvoke();
  return await invoke("start_mock_server", { port, routes });
}

export async function stopMockServer(): Promise<void> {
  if (!isTauri()) {
    // Use Service Worker for web environment
    return await webMockServerService.stopMockServer();
  }
  const invoke = await getInvoke();
  return await invoke("stop_mock_server");
}

export async function addMockRoute(route: MockRoute): Promise<void> {
  if (!isTauri()) {
    // Use Service Worker for web environment
    return await webMockServerService.addMockRoute(route);
  }
  const invoke = await getInvoke();
  return await invoke("add_mock_route", { route });
}

export async function getMockServerStatus(): Promise<{ running: boolean; port?: number }> {
  if (!isTauri()) {
    // Use Service Worker for web environment
    return await webMockServerService.getMockServerStatus();
  }
  const invoke = await getInvoke();
  return await invoke("get_mock_server_status");
}

export const mockServerService = {
  startMockServer,
  stopMockServer,
  addMockRoute,
  getMockServerStatus,
};

