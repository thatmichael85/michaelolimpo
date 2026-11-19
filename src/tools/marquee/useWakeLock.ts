import { useEffect } from 'react';

/** Keeps the screen on while active; re-acquires after the app returns to the foreground. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wakeLock = (navigator as Partial<Navigator>).wakeLock;
    if (!active || !wakeLock) return;
    let live = true;
    let sentinel: WakeLockSentinel | null = null;
    const acquire = () =>
      wakeLock
        .request('screen')
        .then((s) => {
          if (live) sentinel = s;
          else void s.release();
        })
        .catch(() => {});
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
