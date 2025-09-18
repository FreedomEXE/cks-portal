import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    port: 3005,
    strictPort: false,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cks-hubs': path.resolve(__dirname, '../Frontend/src/hubs'),
      '@cks-packages': path.resolve(__dirname, '../../packages'),
      '@cks-frontend': path.resolve(__dirname, '../Frontend/src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});