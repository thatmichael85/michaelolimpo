import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline support for /marquee/ only: the manifest is a static file linked from marquee/index.html,
    // and the worker is registered by the marquee page itself, so other pages are never controlled.
    VitePWA({
      manifest: false,
      injectRegister: false,
      registerType: 'autoUpdate',
      filename: 'marquee/sw.js',
      workbox: {
        globPatterns: ['marquee/**/*.{html,png,webmanifest}', 'assets/**/*.{js,css,woff2}'],
        // The worker lives in /marquee/, so make precache URLs site-absolute rather than worker-relative.
        modifyURLPrefix: { '': '/' },
        navigateFallback: '/marquee/index.html',
        navigateFallbackAllowlist: [/^\/marquee\//],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: '/',
  build: {
    // multi-page: the landing page plus standalone tools (each with its own entry, no router)
    rollupOptions: {
      input: {
        main: 'index.html',
        downloadphotos: 'tools/downloadphotos/index.html',
        marquee: 'marquee/index.html',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
