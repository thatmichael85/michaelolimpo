import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // multi-page: the landing page plus standalone tools (each with its own entry, no router)
    rollupOptions: {
      input: {
        main: 'index.html',
        downloadphotos: 'tools/downloadphotos/index.html',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
