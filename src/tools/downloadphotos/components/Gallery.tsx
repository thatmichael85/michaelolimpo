import { useEffect, useRef, type MouseEvent } from 'react';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Button } from '../../../design-system/primitives/Button';
import { Text } from '../../../design-system/primitives/Text';
import { monthLabel, type Photo } from '../api';
import type { useGallery } from '../useGallery';

type GalleryData = ReturnType<typeof useGallery>;

// Pick a transform-origin so the 2x hover zoom stays inside the viewport (edge columns grow inward).
// With origin offset o along an axis, the scaled box spans [p - o(Z-1), p + Z*size - o(Z-1)].
const ZOOM = 2;
const ZOOM_PAD = 8;
function fitZoom(img: HTMLElement) {
  const r = img.getBoundingClientRect();
  const k = ZOOM - 1;
  const axis = (p: number, size: number, max: number) => {
    const lo = (p + ZOOM * size - (max - ZOOM_PAD)) / k;
    const hi = (p - ZOOM_PAD) / k;
    return Math.min(Math.max(Math.min(Math.max(size / 2, lo), hi), 0), size);
  };
  img.style.transformOrigin =
    axis(r.left, r.width, document.documentElement.clientWidth) + 'px ' + axis(r.top, r.height, window.innerHeight) + 'px';
}

const onGridHover = (e: MouseEvent<HTMLDivElement>) => {
  const t = e.target as HTMLElement;
  if (t.matches('.cf-thumb img')) fitZoom(t);
};

function useNearViewport(ref: React.RefObject<HTMLElement | null>, onChange: (v: boolean) => void, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (!('IntersectionObserver' in window)) {
      onChange(true);
      return;
    }
    const io = new IntersectionObserver((es) => onChange(es[es.length - 1].isIntersecting), {
      rootMargin: '0px 0px 600px 0px',
    });
    io.observe(el);
    return () => {
      io.disconnect();
      onChange(false);
    };
  }, [ref, onChange, enabled]);
}

export function Gallery({ g, onOpen }: { g: GalleryData; onOpen: (p: Photo) => void }) {
  const sentinel = useRef<HTMLDivElement>(null);
  useNearViewport(sentinel, g.setSentinelVisible, true);

  return (
    <>
      <div className="cf-gallery">
        {g.keys.map((key) => (
          <section key={key} className="cf-month" aria-label={monthLabel(key)}>
            <h3 className="cf-month-h">{monthLabel(key)}</h3>
            <div className="cf-grid" onMouseOver={onGridHover}>
              {g.photos[key].map((p, i) => (
                <button key={p.id ?? i} type="button" className="cf-thumb"
                  onClick={() => onOpen(p)} aria-label={`Open photo${p.date ? ' from ' + p.date : ''}`}>
                  <img src={p.thumb} alt="" loading="lazy" title={p.date || undefined} draggable={false} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div ref={sentinel} style={{ height: 1 }} />
      <div className="cf-more cf-row">
        {g.list.loading && g.keys.length === 0 && <Spinner size="md" label="Loading photos…" />}
        {g.list.error && (
          <>
            <Text variant="secondary" className="cf-status" role="alert">
              {g.list.error}
            </Text>
            <Button variant="outline" onClick={() => void g.retryList()}>
              Load more
            </Button>
          </>
        )}
        {g.list.loading && g.keys.length > 0 && <Spinner size="sm" label="Loading…" />}
        {g.list.next && !g.list.loading && !g.list.error && (
          <Button variant="outline" onClick={() => void g.retryList()}>Load more</Button>
        )}
        {g.allDone && !g.list.error && (
          <Text variant="secondary" className="cf-status">
            {g.keys.length ? '— end of photos —' : 'No photos yet.'}
          </Text>
        )}
      </div>
    </>
  );
}
