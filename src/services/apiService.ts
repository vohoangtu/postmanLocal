import { isTauri } from "../utils/platform";

export interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface HttpResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
}

async function getInvoke() {
  if (!isTauri()) {
    throw new Error("Tauri API is not available in web environment");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke;
}

export async function executeRequest(
  request: HttpRequest
): Promise<HttpResponse> {
  if (!isTauri()) {
    // Fallback to fetch for web environment
    // Service Worker will intercept if mock server is running
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      return {
        status: response.status,
        status_text: response.statusText,
        headers,
        body: await response.text(),
      };
    } catch (error: any) {
      // If connection refused and it's localhost, might be mock server issue
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        const url = new URL(request.url);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          throw new Error(`Connection refused to ${request.url}. Make sure Mock Server is running and the route is configured.`);
        }
      }
      throw error;
    }
  }
  
  const invoke = await getInvoke();
  return await invoke("execute_request", { request });
}

export async function saveRequest(
  name: string,
  method: string,
  url: string,
  headers: string,
  body?: string
): Promise<void> {
  if (!isTauri()) {
    // Web fallback: save to localStorage
    const savedRequests = JSON.parse(localStorage.getItem("postmanlocal_requests") || "[]");
    savedRequests.push({ name, method, url, headers, body, timestamp: Date.now() });
    localStorage.setItem("postmanlocal_requests", JSON.stringify(savedRequests));
    return;
  }
  
  const invoke = await getInvoke();
  return await invoke("save_request", { name, method, url, headers, body });
}

export async function loadCollections(): Promise<any[]> {
  if (!isTauri()) {
    // Web fallback: load from localStorage
    try {
      const data = localStorage.getItem("postmanlocal_collections");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  const invoke = await getInvoke();
  return await invoke("load_collections");
}


