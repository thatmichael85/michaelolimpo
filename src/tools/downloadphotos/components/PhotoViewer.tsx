import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lightbox, type LightboxMedia } from '@astryxdesign/core/Lightbox';
import { Badge } from '../../../design-system/primitives/Badge';
import { Button } from '../../../design-system/primitives/Button';
import type { Photo } from '../api';
import { downloadOne } from '../download';
import { attachViewerZoom, type ZoomController } from '../zoom';

type DlState = 'idle' | 'busy' | 'saved' | 'failed';

/** Astryx Lightbox in gallery mode (prev/next, Escape/backdrop close), with our zoom & pan on top. */
export function PhotoViewer({
  photos,
  open,
  onChange,
}: {
  photos: Photo[];
  open: Photo | null;
  onChange: (p: Photo | null) => void;
}) {
  const index = open ? photos.indexOf(open) : -1;
  const isOpen = index >= 0;
  const current = isOpen ? photos[index] : undefined;
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const zoom = useRef<ZoomController | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [dl, setDl] = useState<DlState>('idle');

  useEffect(() => {
    if (!dialog) return;
    const z = attachViewerZoom(dialog, (v) => setZoomed(v > 1), () => onChange(null));
    zoom.current = z;
    return () => {
      z.destroy();
      zoom.current = null;
    };
  }, [dialog, onChange]);

  // new photo: back to fit, fresh download button
  useEffect(() => {
    zoom.current?.reset();
    setDl('idle');
  }, [current?.id, current?.url]);

  const save = useCallback(async () => {
    if (!current) return;
    setDl('busy');
    try {
      await downloadOne(current);
      setDl('saved');
      setTimeout(() => setDl((s) => (s === 'saved' ? 'idle' : s)), 1200);
    } catch {
      setDl('failed');
    }
  }, [current]);

  const caption = current && (
    <div className="cf-viewer-bar" data-viewer-caption>
      {current.date && <Badge>{current.date}</Badge>}
      <span className="cf-viewer-zoom">
        <Button variant="secondary" size="sm" aria-label="Zoom out" title="Zoom out" onClick={() => zoom.current?.zoomBy(1 / 1.5)}>
          −
        </Button>
        <Button variant="secondary" size="sm" aria-label="Zoom in" title="Zoom in" onClick={() => zoom.current?.zoomBy(1.5)}>
          +
        </Button>
        <Button variant="secondary" size="sm" title="Fit to screen" onClick={() => zoom.current?.fit()} disabled={!zoomed}>
          Fit
        </Button>
      </span>
      <Button size="sm" className="cf-viewer-dl" onClick={() => void save()} disabled={dl === 'busy' || dl === 'saved'}>
        {dl === 'busy' ? 'Downloading…' : dl === 'saved' ? 'Saved ✓' : dl === 'failed' ? 'Failed — retry' : 'Download this photo'}
      </Button>
    </div>
  );

  // only the current item carries the caption (the list can be thousands long)
  const media = useMemo<LightboxMedia[]>(
    () => photos.map((p) => ({ src: p.url, alt: p.date ? `Photo from ${p.date}` : 'Photo' })),
    [photos],
  );
  const withCaption = isOpen ? media.map((m, i) => (i === index ? { ...m, caption } : m)) : media;

  if (!photos.length) return null;
  return (
    <Lightbox
      ref={setDialog}
      className="cf-viewer"
      isOpen={isOpen}
      onOpenChange={(o) => !o && onChange(null)}
      media={withCaption}
      index={Math.max(0, index)}
      onIndexChange={(i) => onChange(photos[i] ?? null)}
    />
  );
}
