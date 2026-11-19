type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element | null };

/** Launched from the Home Screen: already chrome-free, nothing to do. */
export function isStandalone(): boolean {
  const media = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return media || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const quiet = (r: Promise<void> | void) => {
  if (r instanceof Promise) r.catch(() => {});
};

/** Must be called from the Play tap itself (browsers require a user gesture). */
export function enterFullscreen(): void {
  if (isStandalone()) return;
  const el = document.documentElement as FsElement;
  try {
    quiet(el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.());
  } catch {
    // Not supported (e.g. iPhone Safari): the sign still fills the page.
  }
}

export function exitFullscreen(): void {
  const doc = document as FsDocument;
  if (!(doc.fullscreenElement ?? doc.webkitFullscreenElement)) return;
  try {
    quiet(doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.());
  } catch {
    // ignore
  }
}
