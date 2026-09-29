import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    host: true,
  },
  preview: {
    port: 5190,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2018',
    rollupOptions: {
      output: {
        // keep the big 3D library in its own file so the rest of the site loads first
        manualChunks: id => (id.includes('node_modules/three') || id.includes('node_modules/postprocessing') ? 'three' : undefined),
      },
    },
  },
  base: '/',
})
