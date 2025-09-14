import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3004,
    open: true,
    fs: {
      // allow importing assets from repo root (e.g., ../../../../docs/images/cks-logo.png)
      allow: [path.resolve(__dirname, '..', '..', '..')]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
