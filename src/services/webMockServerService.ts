/**
 * Web Mock Server Service
 * Sử dụng Service Worker để intercept requests và trả về mock responses
 */

import { MockRoute } from './mockServerService';

const MOCK_ROUTES_KEY = 'postmanlocal_mock_routes';
const MOCK_SERVER_STATUS_KEY = 'postmanlocal_mock_server_status';

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

// Get service worker registration (should be registered in main.tsx)
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if ('serviceWorker' in navigator) {
    // Try to get existing registration
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      serviceWorkerRegistration = registration;
      return registration;
    }
    
    // If not registered yet, register it
    try {
      const newRegistration = await navigator.serviceWorker.register('/mock-service-worker.js', {
        scope: '/',
      });
      serviceWorkerRegistration = newRegistration;
      return newRegistration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      throw error;
    }
  } else {
    throw new Error('Service Workers are not supported in this browser');
  }
}

// Ensure Service Worker is registered
async function ensureServiceWorker(): Promise<void> {
  if (!serviceWorkerRegistration) {
    await getServiceWorkerRegistration();
  }
  
  // Wait for service worker to be ready
  if (serviceWorkerRegistration?.active) {
    return;
  }
  
  // Wait for service worker to activate
  await new Promise<void>((resolve) => {
    if (serviceWorkerRegistration?.installing) {
      serviceWorkerRegistration.installing.addEventListener('statechange', () => {
        if (serviceWorkerRegistration?.installing?.state === 'activated') {
          resolve();
        }
      });
    } else if (serviceWorkerRegistration?.waiting) {
      // If waiting, skip waiting to activate immediately
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      resolve();
    } else {
      resolve();
    }
  });
}

// Save routes to localStorage
function saveRoutes(routes: MockRoute[]): void {
  localStorage.setItem(MOCK_ROUTES_KEY, JSON.stringify(routes));
  
  // Notify service worker
  if (serviceWorkerRegistration?.active) {
    serviceWorkerRegistration.active.postMessage({
      type: 'UPDATE_ROUTES',
      routes: routes,
    });
  } else if (serviceWorkerRegistration?.waiting) {
    serviceWorkerRegistration.waiting.postMessage({
      type: 'UPDATE_ROUTES',
      routes: routes,
    });
  }
}

// Save server status to localStorage
function saveServerStatus(running: boolean, port: number): void {
  localStorage.setItem(MOCK_SERVER_STATUS_KEY, JSON.stringify({ running, port }));
  
  // Notify service worker
  if (serviceWorkerRegistration?.active) {
    serviceWorkerRegistration.active.postMessage({
      type: 'UPDATE_STATUS',
      status: { running, port },
    });
  } else if (serviceWorkerRegistration?.waiting) {
    serviceWorkerRegistration.waiting.postMessage({
      type: 'UPDATE_STATUS',
      status: { running, port },
    });
  }
}

// Sync all data with service worker
function syncWithServiceWorker(): void {
  const routes = loadRoutes();
  const status = getServerStatus();
  
  if (serviceWorkerRegistration?.active) {
    serviceWorkerRegistration.active.postMessage({
      type: 'SYNC_DATA',
      routes: routes,
      status: status,
    });
  } else if (serviceWorkerRegistration?.waiting) {
    serviceWorkerRegistration.waiting.postMessage({
      type: 'SYNC_DATA',
      routes: routes,
      status: status,
    });
  }
}

// Load routes from localStorage
function loadRoutes(): MockRoute[] {
  try {
    const routesJson = localStorage.getItem(MOCK_ROUTES_KEY);
    return routesJson ? JSON.parse(routesJson) : [];
  } catch {
    return [];
  }
}

// Load server status from localStorage
function getServerStatus(): { running: boolean; port: number } {
  try {
    const statusJson = localStorage.getItem(MOCK_SERVER_STATUS_KEY);
    return statusJson ? JSON.parse(statusJson) : { running: false, port: 3000 };
  } catch {
    return { running: false, port: 3000 };
  }
}

export const webMockServerService = {
  async startMockServer(port: number, routes: MockRoute[]): Promise<void> {
    try {
      await ensureServiceWorker();
      saveRoutes(routes);
      saveServerStatus(true, port);
      syncWithServiceWorker();
    } catch (error) {
      console.error('Failed to start web mock server:', error);
      throw error;
    }
  },

  async stopMockServer(): Promise<void> {
    const status = getServerStatus();
    saveServerStatus(false, status.port);
    syncWithServiceWorker();
  },

  async addMockRoute(route: MockRoute): Promise<void> {
    const routes = loadRoutes();
    routes.push(route);
    await ensureServiceWorker();
    saveRoutes(routes);
    syncWithServiceWorker();
  },

  async getMockServerStatus(): Promise<{ running: boolean; port?: number }> {
    return getServerStatus();
  },
};

// Service Worker sẽ được register trong main.tsx
// Không cần auto-register ở đây để tránh conflict

