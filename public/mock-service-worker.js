/**
 * Mock Service Worker cho Web Environment
 * Intercept fetch requests và trả về mock responses
 * 
 * Note: Service Worker không thể truy cập localStorage trực tiếp
 * Sử dụng IndexedDB hoặc postMessage để sync data
 */

let mockRoutes = [];
let serverStatus = { running: false, port: 3000 };

// Sync routes từ main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_ROUTES') {
    mockRoutes = event.data.routes || [];
  }
  
  if (event.data && event.data.type === 'UPDATE_STATUS') {
    serverStatus = event.data.status || { running: false, port: 3000 };
  }
  
  if (event.data && event.data.type === 'SYNC_DATA') {
    mockRoutes = event.data.routes || [];
    serverStatus = event.data.status || { running: false, port: 3000 };
  }
});

// Request data từ main thread khi service worker starts
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'REQUEST_SYNC' });
      });
    })
  );
});

// Find matching route
function findRoute(path, method, routes) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedMethod = method.toUpperCase();
  
  return routes.find(route => {
    const routePath = route.path.startsWith('/') ? route.path : `/${route.path}`;
    return routePath === normalizedPath && route.method.toUpperCase() === normalizedMethod;
  });
}

// Create mock response
function createMockResponse(route) {
  const headers = new Headers();
  
  // Add custom headers
  if (route.headers) {
    Object.entries(route.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  // Default content-type
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const body = typeof route.body === 'string' 
    ? route.body 
    : JSON.stringify(route.body || {});
  
  return new Response(body, {
    status: route.status || 200,
    statusText: getStatusText(route.status || 200),
    headers: headers,
  });
}

function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  };
  return statusTexts[status] || 'OK';
}

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  // Only intercept if server is running
  if (!serverStatus.running) {
    return; // Let request go through normally
  }
  
  const url = new URL(event.request.url);
  
  // Only intercept requests to localhost
  // Note: On web, we can only mock localhost requests due to CORS restrictions
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return; // Let request go through normally
  }
  
  // Check if port matches (for localhost requests)
  // For web, we intercept all localhost requests on the configured port
  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  // Intercept if port matches or if no port specified (defaults to configured port)
  // Note: Service Worker intercepts all localhost requests, so we check port in the route matching
  if (port && port !== String(serverStatus.port) && port !== '80' && port !== '') {
    return; // Let request go through normally if port doesn't match
  }
  
  // Intercept the request
  event.respondWith(
    (async () => {
      const path = url.pathname;
      const method = event.request.method;
      
      const route = findRoute(path, method, mockRoutes);
      
      if (route) {
        // Apply delay if configured
        if (route.delayMs && route.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, route.delayMs));
        }
        
        return createMockResponse(route);
      } else {
        // Route not found - return 404
        return new Response(
          JSON.stringify({
            error: 'Route not found',
            path: path,
            method: method,
          }),
          {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    })()
  );
});

// Message handling is done at the top of the file

