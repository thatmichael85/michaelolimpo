import { sanitize, type Settings } from './settings';

const KEY = 'marquee:v1';

export function loadSettings(store: Pick<Storage, 'getItem'>): Settings {
  try {
    const raw = store.getItem(KEY);
    return sanitize(raw === null ? undefined : JSON.parse(raw));
  } catch {
    return sanitize(undefined);
  }
}

export function saveSettings(store: Pick<Storage, 'setItem'>, s: Settings): void {
  try {
    store.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked (private mode): the sign still works for this session.
  }
}
