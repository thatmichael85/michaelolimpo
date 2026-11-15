// ChildFirst / Taidii API client, ported from the original static tool.
import { encCreds } from './crypto';
import { checkResponse, HttpError, makePacer, withRetry } from './pacer';

export const API = 'https://v2.taidii.com';
export const PAGE_SIZE = 30;
export const API_GAP = 900; // ms between listing/API calls (gentle on their app server)

export interface Child {
  id: number;
  fullname?: string;
  name?: string;
}

export interface Photo {
  id: number | string | null;
  url: string;
  thumb: string;
  date: string; // YYYY-MM-DD or ""
}

export interface PhotoPage {
  results: Photo[];
  next: boolean;
  count?: number;
}

export interface LoginResult {
  token: string;
  children: Child[];
}

const apiSlot = makePacer(API_GAP); // one listing/API call starts every API_GAP

export async function apiGET<T = unknown>(
  token: string | null,
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(API + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  await apiSlot();
  return withRetry(async () => {
    const r = await fetch(url, { headers: token ? { Authorization: 'JWT ' + token } : {} });
    checkResponse(r);
    return (await r.json()) as T;
  });
}

export async function login(user: string, pw: string): Promise<LoginResult> {
  const r = await fetch(API + '/jwt-token-auth/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: encCreds(user.trim()), password: encCreds(pw), is_encrypted: 1 }),
  });
  if (r.status === 400 || r.status === 401) throw new Error('Wrong username or password');
  if (!r.ok) throw new Error('Sign-in failed (' + r.status + ')');
  const data = await r.json();
  if (!data.token) throw new Error('Sign-in failed (no token)');
  return { token: data.token, children: (data.user && data.user.children) || [] };
}

interface RawPhoto {
  id?: number | string;
  full_url?: string;
  photo_url?: string;
  url?: string;
  thumb_url?: string;
  thumb?: string;
  upload_time?: string;
  upload_date?: string;
}

/** One page of tagged photos (kind=1), newest first. */
export async function taggedPage(
  token: string,
  cid: number,
  p: number,
): Promise<PhotoPage> {
  const params: Record<string, string | number> = { kind: 1, page: p, page_size: PAGE_SIZE, student_id: cid };
  const resp = await apiGET<{ data?: { results?: RawPhoto[]; next?: unknown; count?: number } }>(
    token,
    '/api/portfoliov3/student_photos/by_month/',
    params,
  );
  const d = resp.data || {};
  const results = (d.results || [])
    .filter((x) => x.full_url || x.photo_url || x.url)
    .map((x) => ({
      id: x.id ?? null,
      url: (x.full_url || x.photo_url || x.url) as string,
      thumb: (x.thumb_url || x.thumb || x.full_url || x.photo_url || x.url) as string,
      date: (x.upload_time || x.upload_date || '').slice(0, 10),
    }));
  return { results, next: d.next != null ? !!d.next : results.length >= PAGE_SIZE, count: d.count };
}

export function childName(c: Child): string {
  return (c.fullname || c.name || 'child-' + c.id).replace(/[/\\:]/g, '_');
}

/** File name on disk. Unchanged from the static tool so "resume" works against old folders. */
export function fileName(item: Pick<Photo, 'url' | 'date' | 'id'>, n: number): string {
  const ext = (item.url.split('?')[0].match(/\.[a-z0-9]+$/i) || ['.jpg'])[0];
  return `${item.date || 'undated'}_${item.id || 'n' + n}${ext}`;
}

/** "YYYY-MM" month key for a photo, or "undated". */
export function monthKey(date: string): string {
  return (date || '').slice(0, 7) || 'undated';
}

export function monthLabel(date: string): string {
  if (!date || date === 'undated') return 'Undated';
  const [y, m] = date.split('-');
  return new Date(+y, +m - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function isUnauthorized(e: unknown): boolean {
  return e instanceof HttpError && e.status === 401;
}
