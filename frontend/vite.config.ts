import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cks-auth': path.resolve(__dirname, '../auth/src'),
      '@cks-ui': path.resolve(__dirname, '../packages/ui/src'),
      '@cks-domain': path.resolve(__dirname, '../packages/domain-widgets/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: { allow: ['..'] },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
  },
});