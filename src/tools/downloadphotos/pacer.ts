// Rate limiting + retry helpers, ported unchanged from the original static tool.

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Reserve a start slot, `gapMs` after the previous start. */
export function makePacer(gapMs: number, now: () => number = Date.now) {
  let next = 0;
  return async () => {
    const t = now();
    const wait = Math.max(0, next - t);
    next = Math.max(t, next) + gapMs;
    if (wait) await sleep(wait);
  };
}

/** An HTTP failure. `retryAfter` (seconds) is set for 429/5xx, which withRetry retries. */
export class HttpError extends Error {
  status: number;
  retryAfter?: number;
  constructor(status: number, retryAfter?: number) {
    super('http ' + status);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Throw an HttpError for a non-OK response; 429/5xx are marked retryable. */
export function checkResponse(r: Response): void {
  if (r.status === 429 || r.status >= 500) {
    throw new HttpError(r.status, +(r.headers.get('Retry-After') ?? 0) || 0);
  }
  if (!r.ok) throw new HttpError(r.status);
}

function isRetryable(e: unknown): boolean {
  return !(e instanceof HttpError) || e.retryAfter !== undefined;
}

/** Retry with exponential backoff (2s, 4s, 8s, ...) or the server's Retry-After, max 60s. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      // Same as the original: network errors and 429/5xx are retried; other HTTP errors fail fast.
      if (i >= tries - 1 || !isRetryable(e)) throw e;
      const retryAfter = e instanceof HttpError ? e.retryAfter : 0;
      const wait = (retryAfter || Math.pow(2, i + 1)) * 1000;
      await sleep(Math.min(wait, 60000));
    }
  }
}
