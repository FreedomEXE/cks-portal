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
  publicDir: '../../docs/images',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@cks-hubs': path.resolve(__dirname, '../frontend/src/hubs'),
      '@cks-packages': path.resolve(__dirname, '../../packages'),
      '@cks-frontend': path.resolve(__dirname, '../frontend/src'),
      // Auth package (pages/components/hooks)
      '@cks-auth': path.resolve(__dirname, '../Auth/src'),
      // Mock Clerk in the test interface to allow rendering Login without real keys
      '@clerk/clerk-react': path.resolve(__dirname, './src/mocks/clerk-react'),
      // Scoped package-style aliases used inside packages
      '@cks-portal/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@cks-portal/domain-widgets': path.resolve(__dirname, '../../packages/domain-widgets/src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
