import { vi } from 'vitest';

/** Node 25's built-in localStorage shadows jsdom's and is unusable without a file; use memory. */
export function stubLocalStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  });
}

/** jsdom has no ResizeObserver; report a fixed iPad-landscape size on observe. */
export function stubResizeObserver(width = 1180, height = 820) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }
      observe() {
        this.cb([{ contentRect: { width, height } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      disconnect() {}
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
}
