/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: vite.config.test.ts
 *
 * Description:
 * Vite configuration for the test interface sandbox
 *
 * Responsibilities:
 * - Configure Vite dev server on port 3005
 * - Set up test interface entry point
 * - Enable React and TypeScript support
 *
 * Role in system:
 * - Used by npm run test:interface command to run test sandbox
 *
 * Notes:
 * Runs on port 3005 to avoid conflicts with main app (3000)
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    host: true,
    open: true
  },
  root: resolve(__dirname, 'src/test-interface'),
  build: {
    outDir: resolve(__dirname, 'dist-test'),
    rollupOptions: {
      input: resolve(__dirname, 'src/test-interface/index.html')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@roles': resolve(__dirname, 'src/roles'),
      '@test': resolve(__dirname, 'src/test-interface')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.VITE_TEST_INTERFACE': JSON.stringify('true')
  }
})