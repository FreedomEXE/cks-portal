import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsConfigFilePath: './tsconfig.json',
      skipDiagnostics: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Auth',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom', '@clerk/clerk-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          '@clerk/clerk-react': 'ClerkReact',
        },
        assetFileNames: (assetInfo) => {
          if (/\.css$/.test(assetInfo.name ?? '')) return 'style.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    cssCodeSplit: false, // Bundle all CSS into style.css
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});