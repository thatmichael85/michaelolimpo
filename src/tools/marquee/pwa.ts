/** Registers the marquee-only service worker (production builds only) for offline use. */
export function registerMarqueeSW(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/marquee/sw.js', { scope: '/marquee/' }).catch(() => {});
  });
}
