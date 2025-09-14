import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
    // Dev server tweaks for mobile/ngrok access:
  // - host: true allows external access if needed
  // - proxy routes /api -> local API so only one ngrok tunnel is required
  server: {
  // Allow ngrok subdomains
  allowedHosts: ['.ngrok-free.app', '.ngrok.app'],
  host: true,
  port: 5183,
  strictPort: false,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        'cks-auth': path.resolve(__dirname, '../Auth/frontend'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: true,
    },
}))
