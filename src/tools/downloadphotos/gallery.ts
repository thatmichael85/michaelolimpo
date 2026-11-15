// Pure helpers for photo grouping (no React, unit tested).
import { monthKey, type Photo } from './api';

export type PhotosByMonth = Record<string, Photo[]>;

/**
 * Add photos to their year-month bucket, skipping ids already seen across pages.
 * Returns a new object; `seen` is updated in place.
 */
export function addPhotos(prev: PhotosByMonth, items: Photo[], seen: Set<Photo['id']>): PhotosByMonth {
  const added: PhotosByMonth = {};
  for (const item of items) {
    if (item.id != null) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
    }
    (added[monthKey(item.date)] ||= []).push(item);
  }
  const keys = Object.keys(added);
  if (!keys.length) return prev;
  const next = { ...prev };
  for (const k of keys) next[k] = [...(prev[k] ?? []), ...added[k]];
  return next;
}

/** Newest first; "undated" goes last. */
export function compareMonthKeys(a: string, b: string): number {
  const rank = (k: string) => (k === 'undated' ? '' : k);
  return rank(a) < rank(b) ? 1 : rank(a) > rank(b) ? -1 : 0;
}

/** Sections for loaded photos, newest first. */
export function sectionKeys(photos: PhotosByMonth): string[] {
  const keys = new Set(Object.keys(photos));
  return [...keys].sort(compareMonthKeys);
}

/** Loaded photos in gallery order (for the viewer's prev/next). */
export function flattenPhotos(keys: string[], photos: PhotosByMonth): Photo[] {
  return keys.flatMap((k) => photos[k] ?? []);
}

