/**
 * When a newly deployed version takes control, reload once so the fix is visible right away —
 * but not on first install, and never while the sign is showing.
 */
export function reloadOnUpdate(opts: { hadController: boolean; isPlaying: () => boolean; reload: () => void }): () => void {
  let done = false;
  return () => {
    if (done || !opts.hadController || opts.isPlaying()) return;
    done = true;
    opts.reload();
  };
}

/** Registers the marquee-only service worker (production builds only) for offline use. */
export function registerMarqueeSW(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  sw.addEventListener(
    'controllerchange',
    reloadOnUpdate({
      hadController: !!sw.controller,
      isPlaying: () => !!document.querySelector('.mq-play'),
      reload: () => window.location.reload(),
    }),
  );
  window.addEventListener('load', () => {
    sw.register('/tools/marquee/sw.js', { scope: '/tools/marquee/' }).catch(() => {});
  });
}
