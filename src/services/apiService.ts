import { isTauri } from "../utils/platform";
import { cacheService } from "./cacheService";
import { handleError, getUserFriendlyError } from "./errorLogger";
import { retry, isNetworkError } from "../utils/retry";
import { performanceMonitor } from "./performanceMonitor";

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
  request: HttpRequest,
  useCache: boolean = true,
  cacheTTL: number = 5 * 60 * 1000 // 5 minutes default
): Promise<HttpResponse> {
  const startTime = Date.now();

  // Check cache for GET requests
  if (useCache && request.method === "GET") {
    const cacheKey = cacheService.generateRequestKey(request.method, request.url, request.body);
    const cached = await cacheService.get<HttpResponse>(cacheKey);
    if (cached) {
      performanceMonitor.trackRequest(request.url, 0); // Cached, instant
      return cached;
    }
  }

  let response: HttpResponse;

  // Validate URL và certificate trước khi thực hiện request
  try {
    new URL(request.url);
    
    // Validate certificate và security
    const { validateRequestSecurity } = await import('./certificateService');
    const securityCheck = await validateRequestSecurity(request.url);
    
    if (!securityCheck.valid) {
      const securityError = new Error(securityCheck.error || "Security validation failed");
      handleError(securityError, "API Request", { url: request.url, method: request.method });
      throw securityError;
    }
  } catch (error: any) {
    if (error.message && error.message.includes("Security validation")) {
      throw error;
    }
    const invalidUrlError = new Error("URL không hợp lệ");
    handleError(invalidUrlError, "API Request", { url: request.url, method: request.method });
    throw invalidUrlError;
  }

  if (!isTauri()) {
    // Fallback to fetch for web environment với retry logic
    try {
      response = await retry(
        async () => {
          const fetchResponse = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            signal: AbortSignal.timeout(30000), // 30 seconds timeout
          });
          
          const headers: Record<string, string> = {};
          fetchResponse.headers.forEach((value, key) => {
            headers[key] = value;
          });
          
          const body = await fetchResponse.text();
          
          return {
            status: fetchResponse.status,
            status_text: fetchResponse.statusText,
            headers,
            body,
          };
        },
        {
          maxRetries: 2, // Chỉ retry 2 lần cho API requests
          retryDelay: 1000,
          exponentialBackoff: true,
          retryCondition: isNetworkError,
        }
      );
    } catch (error: any) {
      // If connection refused and it's localhost, might be mock server issue
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED') || error.name === 'AbortError') {
        try {
          const url = new URL(request.url);
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            const friendlyError = new Error(
              `Không thể kết nối đến ${request.url}. Vui lòng đảm bảo Mock Server đang chạy và route đã được cấu hình.`
            );
            handleError(friendlyError, "API Request", { url: request.url, method: request.method });
            throw friendlyError;
          }
        } catch {
          // Invalid URL, continue with original error
        }
      }
      const friendlyError = handleError(error, "API Request", { url: request.url, method: request.method });
      throw new Error(friendlyError);
    }
  } else {
    try {
      response = await retry(
        async () => {
          const invoke = await getInvoke();
          return await invoke("execute_request", { request });
        },
        {
          maxRetries: 2,
          retryDelay: 1000,
          exponentialBackoff: true,
          retryCondition: isNetworkError,
        }
      );
    } catch (error: any) {
      const friendlyError = handleError(error, "Tauri API Request", { url: request.url, method: request.method });
      throw new Error(friendlyError);
    }
  }

  // Track performance
  const duration = Date.now() - startTime;
  performanceMonitor.trackRequest(request.url, duration);

  // Cache successful GET responses
  if (useCache && request.method === "GET" && response.status >= 200 && response.status < 300) {
    const cacheKey = cacheService.generateRequestKey(request.method, request.url, request.body);
    await cacheService.set(cacheKey, response, cacheTTL);
  }

  return response;
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


