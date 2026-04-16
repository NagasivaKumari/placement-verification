import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      plugins: [NodeGlobalsPolyfillPlugin({ buffer: true })],
      define: {
        global: 'window',
      },
    },
  },
  define: {
    global: 'window',
  },
})
