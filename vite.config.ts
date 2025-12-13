import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Monaco Editor
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
            return 'monaco-editor';
          }
          // React core
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          // UI libraries
          if (id.includes('lucide-react') || id.includes('framer-motion')) {
            return 'ui-vendor';
          }
          // Zustand stores
          if (id.includes('/stores/')) {
            return 'stores';
          }
          // Services
          if (id.includes('/services/')) {
            return 'services';
          }
          // Large components
          if (id.includes('/components/RequestBuilder/') || id.includes('/components/ResponseViewer/')) {
            return 'request-components';
          }
          if (id.includes('/components/Collections/') || id.includes('/components/Workspaces/')) {
            return 'collection-components';
          }
          // Utils
          if (id.includes('/utils/')) {
            return 'utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
  },
});
