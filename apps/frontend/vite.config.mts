import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// Allow Vite dev server to read CSS/assets from the UI package dist folder
const workspaceRoot = path.resolve(__dirname, '..', '..')
const uiDistPath = path.resolve(workspaceRoot, 'packages', 'ui', 'dist')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use workspace source for domain-widgets during dev/build to avoid missing dist
      '@cks/domain-widgets': path.resolve(workspaceRoot, 'packages', 'domain-widgets', 'src', 'index.ts'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow serving files from the monorepo workspace and UI package dist
      allow: [workspaceRoot, uiDistPath],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
