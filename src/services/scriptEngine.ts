/**
 * Script Engine
 * Execute pre-request và post-request scripts
 */

import { useEnvironmentStore } from '../stores/environmentStore';

export interface ScriptContext {
  pm: {
    request: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: any;
      update: (updates: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: any;
      }) => void;
    };
    environment: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
    };
    globals: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
    };
    collectionVariables: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
    };
    response?: {
      code: number;
      status: string;
      headers: Record<string, string>;
      json: () => any;
      text: () => string;
      responseTime: number;
    };
  };
}

export interface ScriptResult {
  success: boolean;
  error?: string;
  updatedRequest?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
}

/**
 * Execute pre-request script
 */
export async function executePreRequestScript(
  script: string,
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  },
  environmentVariables: Record<string, string> = {}
): Promise<ScriptResult> {
  if (!script || !script.trim()) {
    return { success: true };
  }

  const updatedRequest: any = {
    url: request.url,
    method: request.method,
    headers: { ...request.headers },
    body: request.body,
  };

  const environment = new Map<string, string>(Object.entries(environmentVariables));
  const globals = new Map<string, string>();
  const collectionVariables = new Map<string, string>();

  const context: ScriptContext = {
    pm: {
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: request.body,
        update: (updates) => {
          if (updates.url) updatedRequest.url = updates.url;
          if (updates.method) updatedRequest.method = updates.method;
          if (updates.headers) updatedRequest.headers = { ...updatedRequest.headers, ...updates.headers };
          if (updates.body !== undefined) updatedRequest.body = updates.body;
        },
      },
      environment: {
        get: (key: string) => environment.get(key) || null,
        set: (key: string, value: string) => environment.set(key, value),
      },
      globals: {
        get: (key: string) => globals.get(key) || null,
        set: (key: string, value: string) => globals.set(key, value),
      },
      collectionVariables: {
        get: (key: string) => collectionVariables.get(key) || null,
        set: (key: string, value: string) => collectionVariables.set(key, value),
      },
    },
  };

  try {
    const scriptFunction = new Function('pm', script);
    scriptFunction(context.pm);

    return {
      success: true,
      updatedRequest: {
        url: updatedRequest.url,
        method: updatedRequest.method,
        headers: updatedRequest.headers,
        body: updatedRequest.body,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Script execution failed',
    };
  }
}

/**
 * Execute post-request script
 */
export async function executePostRequestScript(
  script: string,
  request: any,
  response: any,
  responseTime: number,
  environmentVariables: Record<string, string> = {}
): Promise<ScriptResult> {
  if (!script || !script.trim()) {
    return { success: true };
  }

  const environment = new Map<string, string>(Object.entries(environmentVariables));
  const globals = new Map<string, string>();
  const collectionVariables = new Map<string, string>();

  const context: ScriptContext = {
    pm: {
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers || {},
        body: request.body,
        update: () => {
          // Post-request scripts không thể update request
        },
      },
      response: {
        code: response.status,
        status: response.statusText || '',
        headers: response.headers || {},
        json: () => {
          try {
            return typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
          } catch {
            return null;
          }
        },
        text: () => (typeof response.body === 'string' ? response.body : JSON.stringify(response.body)),
        responseTime,
      },
      environment: {
        get: (key: string) => environment.get(key) || null,
        set: (key: string, value: string) => environment.set(key, value),
      },
      globals: {
        get: (key: string) => globals.get(key) || null,
        set: (key: string, value: string) => globals.set(key, value),
      },
      collectionVariables: {
        get: (key: string) => collectionVariables.get(key) || null,
        set: (key: string, value: string) => collectionVariables.set(key, value),
      },
    },
  };

  try {
    const scriptFunction = new Function('pm', script);
    scriptFunction(context.pm);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Script execution failed',
    };
  }
}
