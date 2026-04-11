import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/giant-schrodinger/',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split large third-party libraries into separate chunks so
        // they can be cached independently and so the main entry
        // chunk stays under Vite's 500 kB warning threshold.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          if (id.includes('node_modules/@sentry/')) {
            return 'vendor-sentry';
          }

          if (id.includes('node_modules/posthog-js')) {
            return 'vendor-posthog';
          }

          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }

          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-ai';
          }

          return undefined;
        },
      },
    },
  },
});
