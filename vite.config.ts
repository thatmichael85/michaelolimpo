import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Offline support for /tools/marquee/ only: the manifest is a static file linked from
    // tools/marquee/index.html, and the worker is registered by the marquee page itself, so other pages
    // are never controlled. (The old /marquee/ path is a static redirect + kill-switch worker in public/marquee/.)
    VitePWA({
      manifest: false,
      injectRegister: false,
      registerType: 'autoUpdate',
      filename: 'tools/marquee/sw.js',
      workbox: {
        globPatterns: ['tools/marquee/**/*.{html,png,webmanifest}', 'assets/**/*.{js,css,woff2}'],
        // The worker lives in /tools/marquee/, so make precache URLs site-absolute rather than worker-relative.
        modifyURLPrefix: { '': '/' },
        navigateFallback: '/tools/marquee/index.html',
        navigateFallbackAllowlist: [/^\/tools\/marquee\//],
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
        marquee: 'tools/marquee/index.html',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
