import { describe, expect, it, vi } from 'vitest';
import manifestSrc from '../../../public/tools/marquee/manifest.webmanifest?raw';
import pageHtml from '../../../tools/marquee/index.html?raw';
import pwaSrc from './pwa.ts?raw';
import redirectHtml from '../../../public/marquee/index.html?raw';
import killSwitchSrc from '../../../public/marquee/sw.js?raw';

// Marquee moved from /marquee/ to /tools/marquee/. GitHub Pages has no server redirects, so the old
// path keeps a static redirect page plus a kill-switch service worker for devices that installed the
// old offline version (otherwise their cached worker keeps serving the old app and never redirects).

describe('marquee lives at /tools/marquee/', () => {
  it('manifest is scoped to the new path', () => {
    const m = JSON.parse(manifestSrc);
    expect(m.start_url).toBe('/tools/marquee/');
    expect(m.scope).toBe('/tools/marquee/');
    for (const icon of m.icons) expect(icon.src).toMatch(/^\/tools\/marquee\//);
  });

  it('page links the new manifest and canonical URL', () => {
    const html = pageHtml;
    expect(html).toContain('href="/tools/marquee/manifest.webmanifest"');
    expect(html).toContain('href="https://mikeosoft.ai/tools/marquee/"');
    expect(html).not.toMatch(/"\/marquee\//);
  });

  it('registers its service worker under the new scope', () => {
    const src = pwaSrc;
    expect(src).toContain("register('/tools/marquee/sw.js', { scope: '/tools/marquee/' })");
  });
});

describe('/marquee/ redirect page', () => {
  const html = redirectHtml;

  it('redirects to /tools/marquee/ with and without JavaScript', () => {
    expect(html).toMatch(/<meta http-equiv="refresh" content="0; url=\/tools\/marquee\/"/);
    expect(html).toContain('location.replace(');
    expect(html).toContain('<link rel="canonical" href="https://mikeosoft.ai/tools/marquee/"');
  });

  it('keeps the query string and hash when redirecting', () => {
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    const replace = vi.fn();
    new Function('location', script)({ search: '?a=1', hash: '#x', replace });
    expect(replace).toHaveBeenCalledWith('/tools/marquee/?a=1#x');
  });
});

describe('/marquee/sw.js kill switch', () => {
  async function runWorker() {
    const listeners: Record<string, (e: unknown) => void> = {};
    const order: string[] = [];
    const navigate = vi.fn(async () => order.push('navigate'));
    const self = {
      registration: {
        scope: 'https://mikeosoft.ai/marquee/',
        unregister: vi.fn(async () => order.push('unregister')),
      },
      skipWaiting: vi.fn(),
      clients: {
        claim: vi.fn(async () => order.push('claim')),
        matchAll: vi.fn(async () => [{ navigate }]),
      },
      addEventListener: (type: string, fn: (e: unknown) => void) => (listeners[type] = fn),
    };
    const caches = {
      keys: vi.fn(async () => [
        'workbox-precache-v2-https://mikeosoft.ai/marquee/',
        'workbox-precache-v2-https://mikeosoft.ai/tools/marquee/',
      ]),
      delete: vi.fn(async () => true),
    };
    new Function('self', 'caches', killSwitchSrc)(self, caches);

    listeners.install({});
    let done: Promise<unknown> = Promise.resolve();
    listeners.activate({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
    return { self, caches, navigate, order };
  }

  it('activates immediately, clears only the old cache, unregisters and sends pages to the new path', async () => {
    const { self, caches, navigate, order } = await runWorker();
    expect(self.skipWaiting).toHaveBeenCalled();
    expect(caches.delete).toHaveBeenCalledTimes(1);
    expect(caches.delete).toHaveBeenCalledWith('workbox-precache-v2-https://mikeosoft.ai/marquee/');
    expect(self.registration.unregister).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/tools/marquee/');
    // Must control the page before it can navigate it, and unregister first so the reload hits the network.
    expect(order).toEqual(['claim', 'unregister', 'navigate']);
  });
});
