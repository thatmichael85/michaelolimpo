import type { Child } from './api';

// Keep the session across page refreshes, but not after the tab is closed.
// sessionStorage can throw (private mode), so every access is guarded.
const SKEY = 'cf_session';

export interface Session {
  token: string;
  children: Child[];
}

export function saveSession(s: Session): void {
  try {
    sessionStorage.setItem(SKEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

export function loadSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
    return s && s.token && Array.isArray(s.children) && s.children.length ? s : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SKEY);
  } catch {
    /* storage unavailable */
  }
}
