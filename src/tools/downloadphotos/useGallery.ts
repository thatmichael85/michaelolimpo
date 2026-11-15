import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GALLERY_PAGE_SIZE, isUnauthorized, taggedPage, type Photo } from './api';
import { addPhotos, flattenPhotos, sectionKeys, type PhotosByMonth } from './gallery';

/** Consecutive newest-first pages; a child switch mounts a fresh gallery. */
export function useGallery(token: string, childId: number, onUnauthorized: () => void) {
  const [photos, setPhotos] = useState<PhotosByMonth>({});
  const [count, setCount] = useState('…');
  const [list, setList] = useState({ next: true, loading: false, error: '' });
  const [sentinelVisible, setSentinelVisible] = useState(false);
  const alive = useRef(true);
  const seen = useRef(new Set<Photo['id']>());
  const page = useRef(1);
  const busy = useRef(false);
  const done = useRef(false);
  const started = useRef(false);

  const load = useCallback(async () => {
    if (busy.current || done.current) return;
    busy.current = true;
    setList(l => ({ ...l, loading: true, error: '' }));
    try {
      const d = await taggedPage(token, childId, page.current, GALLERY_PAGE_SIZE);
      if (!alive.current) return;
      // Compute outside the React updater: deduplication mutates the seen set.
      const fresh = addPhotos({}, d.results, seen.current);
      setPhotos(prev => {
        const next = { ...prev };
        for (const [key, items] of Object.entries(fresh)) next[key] = [...(prev[key] ?? []), ...items];
        return next;
      });
      if (page.current === 1) setCount(d.count != null ? `${d.count} photos` : `${d.results.length}+ photos`);
      page.current++;
      done.current = !d.next;
      setList({ next: d.next, loading: false, error: '' });
    } catch (e) {
      if (!alive.current) return;
      if (isUnauthorized(e)) onUnauthorized();
      else setList(l => ({ ...l, loading: false, error: "Couldn't load photos: " + (e as Error).message }));
    } finally {
      busy.current = false;
    }
  }, [token, childId, onUnauthorized]);

  useEffect(() => {
    alive.current = true;
    if (!started.current) { started.current = true; void load(); }
    return () => { alive.current = false; };
  }, [load]);

  useEffect(() => {
    if (sentinelVisible && !list.loading && list.next && !list.error) void load();
  }, [sentinelVisible, list, load]);

  const keys = useMemo(() => sectionKeys(photos), [photos]);
  const flat = useMemo(() => flattenPhotos(keys, photos), [keys, photos]);
  return { photos, count, keys, flat, list, allDone: !list.next, setSentinelVisible, retryList: load };
}
