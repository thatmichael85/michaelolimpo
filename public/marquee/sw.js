// Kill switch for the old /marquee/ service worker. Marquee moved to /tools/marquee/.
// Devices that installed the old offline version check this URL for updates; this worker replaces
// the old one, drops its cache, unregisters itself and sends open pages to the new path.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.endsWith(self.registration.scope)).map((k) => caches.delete(k)));
      await self.registration.unregister();
      const pages = await self.clients.matchAll({ type: 'window' });
      await Promise.all(pages.map((page) => page.navigate('/tools/marquee/').catch(() => {})));
    })(),
  );
});
