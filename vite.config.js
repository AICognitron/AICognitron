import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    strictPort: true,
    host: true,
    // Think-X backend (server/index.js)
    proxy: {
      '/api': 'http://localhost:5091'
    }
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:5091'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    },
    target: 'es2015'
  },
  base: '/',
  esbuild: {
    target: 'es2015'
  }
})
