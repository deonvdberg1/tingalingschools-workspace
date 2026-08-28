import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apps/',
  server: {
    host: '127.0.0.1',
    port: 8092,
    strictPort: true
  },
  preview: {
    host: '127.0.0.1',
    port: 8092,
    strictPort: true,
    allowedHosts: ['store.autoeffortless.com', 'localhost']
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
