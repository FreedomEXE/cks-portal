import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@clerk/clerk-react', 'use-sync-external-store/shim'],
  },
  ssr: {
    noExternal: ['@clerk/clerk-react'],
  },

  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@cks-domain', replacement: path.resolve(__dirname, '../packages/domain-widgets/src') },
      { find: 'use-sync-external-store/shim/index.js', replacement: path.resolve(__dirname, './src/shims/useSyncExternalStore/index.js') },
      { find: 'use-sync-external-store/shim/index.mjs', replacement: path.resolve(__dirname, './src/shims/useSyncExternalStore/index.js') },
      { find: 'use-sync-external-store/shim', replacement: path.resolve(__dirname, './src/shims/useSyncExternalStore/index.js') },
    ],
  },
  server: {
    port: 5173,
    open: true,
    fs: { allow: ['..'] },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
  },
});
