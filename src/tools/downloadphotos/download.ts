// "Download all" + single-photo download, ported from the original static tool.
// Folder save via the File System Access API (Chrome/Edge) with resume; ZIP-per-month fallback elsewhere.
import JSZip from 'jszip';
import { childName, fileName, taggedPage, type Child, type Photo } from './api';
import { checkResponse, makePacer, withRetry } from './pacer';

export const FILE_GAP = 150; // ms between photo downloads (from their media CDN)
export const FILE_WORKERS = 4; // parallel photo downloads (~6-7/sec, ~15 min for 5000)

const fileSlot = makePacer(FILE_GAP); // one photo download starts every FILE_GAP

// Minimal File System Access API typings (not in lib.dom yet).
interface WritableLike {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface FileHandleLike {
  getFile(): Promise<File>;
  createWritable(): Promise<WritableLike>;
}
export interface DirHandleLike {
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<DirHandleLike>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileHandleLike>;
}
type PickerWindow = Window & { showDirectoryPicker?: (o: { mode: 'readwrite' }) => Promise<DirHandleLike> };

export function hasFolderSave(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export function fmtEta(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '';
  sec = Math.round(sec);
  if (sec < 60) return `~${sec}s left`;
  return `~${Math.floor(sec / 60)} min left`;
}

export async function listAll(
  token: string,
  cid: number,
  onCount: (n: number, total?: number) => void,
): Promise<Photo[]> {
  const items: Photo[] = [];
  for (let p = 1; ; p++) {
    const d = await taggedPage(token, cid, p);
    items.push(...d.results);
    onCount(items.length, d.count);
    if (!d.next) break;
  }
  return items;
}

export async function fetchBlob(url: string): Promise<Blob> {
  await fileSlot(); // reserve a start slot (paced FILE_GAP apart)
  return withRetry(async () => {
    const r = await fetch(url);
    checkResponse(r);
    return r.blob();
  });
}

export async function runPool<T>(tasks: T[], n: number, worker: (t: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, tasks.length) }, async () => {
      while (i < tasks.length) {
        const t = tasks[i++];
        await worker(t);
      }
    }),
  );
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  // revoke on the next tick so Safari has started the download
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

/** Download one photo at full resolution, using the same file name as "Download all". */
export async function downloadOne(item: Photo): Promise<void> {
  const r = await fetch(item.url);
  if (!r.ok) throw new Error('http ' + r.status);
  saveBlob(await r.blob(), fileName(item, 0));
}

export interface DownloadProgress {
  /** null = indeterminate */
  value: number | null;
  max: number;
  status: string;
  range?: string;
}

export interface DownloadOptions {
  token: string;
  child: Child;
  onProgress: (p: DownloadProgress) => void;
}

/** Returns the final status line, or null if the user cancelled the folder picker. */
export async function downloadAll({ token, child, onProgress }: DownloadOptions): Promise<string | null> {
  const name = childName(child);
  let dirHandle: DirHandleLike | null = null;
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (picker) {
    try {
      dirHandle = await (await picker.call(window, { mode: 'readwrite' })).getDirectoryHandle(name, { create: true });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null;
      throw e;
    }
  }
  let range: string | undefined;
  const report = (value: number | null, max: number, status: string) => onProgress({ value, max, status, range });
  report(null, 1, 'Finding photos…');

  const raw = await listAll(token, child.id, (n, total) => {
    report(null, 1, `Finding photos… ${n}${total ? ' / ' + total : ''}`);
  });
  const items = raw.map((it, idx) => ({ ...it, fname: fileName(it, idx) }));
  const dates = items.map((i) => i.date).filter(Boolean).sort();
  if (dates.length) range = dates[0] + ' → ' + dates[dates.length - 1];

  let saved = 0;
  let skipped = 0;
  let failed = 0;
  let done = 0;

  if (dirHandle) {
    // RESUME: skip photos already saved (non-empty) so re-runs only fetch what's missing
    report(null, 1, 'Checking which photos you already have…');
    const todo: typeof items = [];
    for (const it of items) {
      let have = false;
      try {
        have = (await (await dirHandle.getFileHandle(it.fname)).getFile()).size > 0;
      } catch {
        /* not on disk yet */
      }
      if (have) skipped++;
      else todo.push(it);
    }
    if (!todo.length) return `Nothing to download — you already have all ${items.length} photos.`;
    report(0, todo.length, `0 / ${todo.length} new`);
    const start = Date.now();
    const tick = () => {
      done++;
      const rate = done / ((Date.now() - start) / 1000); // files/sec actually achieved
      const eta = rate > 0 ? (todo.length - done) / rate : Infinity;
      report(
        done,
        todo.length,
        `${done} / ${todo.length} new — ${saved} saved${skipped ? `, ${skipped} already had` : ''}${failed ? `, ${failed} failed` : ''}` +
          (done < todo.length ? `  ·  ${fmtEta(eta)}` : ''),
      );
    };
    const dir = dirHandle;
    await runPool(todo, FILE_WORKERS, async (item) => {
      try {
        const blob = await fetchBlob(item.url);
        const w = await (await dir.getFileHandle(item.fname, { create: true })).createWritable();
        await w.write(blob);
        await w.close();
        saved++;
      } catch {
        failed++;
      }
      tick();
    });
  } else {
    // ZIP-per-month fallback (can't resume — re-zips each run)
    report(0, items.length, `0 / ${items.length}`);
    const start = Date.now();
    const tick = () => {
      done++;
      const rate = done / ((Date.now() - start) / 1000);
      const eta = rate > 0 ? (items.length - done) / rate : Infinity;
      report(
        done,
        items.length,
        `${done} / ${items.length} — ${saved} added${failed ? `, ${failed} failed` : ''}` +
          (done < items.length ? `  ·  ${fmtEta(eta)}` : ''),
      );
    };
    const byMonth: Record<string, typeof items> = {};
    items.forEach((it) => {
      (byMonth[(it.date || 'undated').slice(0, 7)] ||= []).push(it);
    });
    for (const [month, list] of Object.entries(byMonth).sort()) {
      const zip = new JSZip();
      await runPool(list, FILE_WORKERS, async (item) => {
        try {
          zip.file(item.fname, await fetchBlob(item.url));
          saved++;
        } catch {
          failed++;
        }
        tick();
      });
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${name}_${month}.zip`);
    }
  }

  return (
    `Done — ${saved} saved${skipped ? `, ${skipped} already had` : ''}` +
    (failed ? `, ${failed} failed — click Download again and pick the same folder to retry them.` : '.')
  );
}
