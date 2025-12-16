import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { isWeb } from "./utils/platform";

// Register Service Worker for web mock server (only in web environment)
if (isWeb() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/mock-service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'REQUEST_SYNC') {
            // Service worker is requesting data sync
            const routesJson = localStorage.getItem('postmanlocal_mock_routes');
            const statusJson = localStorage.getItem('postmanlocal_mock_server_status');
            
            const routes = routesJson ? JSON.parse(routesJson) : [];
            const status = statusJson ? JSON.parse(statusJson) : { running: false, port: 3000 };
            
            if (registration.active) {
              registration.active.postMessage({
                type: 'SYNC_DATA',
                routes: routes,
                status: status,
              });
            }
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);


