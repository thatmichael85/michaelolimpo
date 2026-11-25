import { vi, type Mock } from 'vitest';
import type {
  DownloadMonitor,
  LanguageModelSession,
  LanguageModelStatic,
  NanoAvailability,
} from '../components/chat/languageModel';

/** Test double for Chrome's Prompt API, installed on globalThis.LanguageModel. */
export interface FakeLanguageModelOptions {
  /** Default 'available'; an Error makes availability() reject. */
  availability?: NanoAvailability | Error;
  /** Chunks per prompt, consumed in order. Default [['Hello']]. */
  replies?: string[][];
  /** create() rejects with this once, then succeeds. */
  createError?: Error;
  /** promptStreaming throws this on first iteration. */
  promptError?: Error;
  /** create() stays pending until fake.resolveCreate(). */
  holdCreate?: boolean;
  /** Each stream yields its first chunk, then waits for fake.releaseStream(). */
  holdStream?: boolean;
  /** 'loaded' values emitted to the download monitor during create(). */
  downloadProgress?: number[];
}

export interface FakeSession {
  promptStreaming: Mock<LanguageModelSession['promptStreaming']>;
  destroy: Mock<() => void>;
}

export interface FakeLanguageModel {
  availability: Mock<LanguageModelStatic['availability']>;
  create: Mock<LanguageModelStatic['create']>;
  sessions: FakeSession[];
  resolveCreate(): void;
  releaseStream(): void;
}

const abortError = () => new DOMException('aborted', 'AbortError');

export function installFakeLanguageModel(opts: FakeLanguageModelOptions = {}): FakeLanguageModel {
  const replies = [...(opts.replies ?? [['Hello']])];
  let createError = opts.createError;
  let pendingCreate: (() => void) | null = null;
  let createGate: Promise<void> | null = null;
  let streamWaiters: Array<() => void> = [];

  const fake: FakeLanguageModel = {
    sessions: [],
    resolveCreate() {
      pendingCreate?.();
    },
    releaseStream() {
      const waiters = streamWaiters;
      streamWaiters = [];
      waiters.forEach((w) => w());
    },
    availability: vi.fn(async () => {
      if (opts.availability instanceof Error) throw opts.availability;
      return opts.availability ?? 'available';
    }),
    create: vi.fn(async (options) => {
      const monitor: DownloadMonitor = {
        addEventListener: (_type, cb) => {
          for (const loaded of opts.downloadProgress ?? []) cb({ loaded });
        },
      };
      options.monitor?.(monitor);
      if (opts.holdCreate) {
        createGate ??= new Promise<void>((resolve) => (pendingCreate = resolve));
        await createGate;
      }
      if (createError) {
        const err = createError;
        createError = undefined;
        throw err;
      }
      const session: FakeSession = {
        destroy: vi.fn(),
        promptStreaming: vi.fn((_input: string, streamOpts?: { signal?: AbortSignal }) => {
          const signal = streamOpts?.signal;
          const nextChunks = replies.shift() ?? ['Hello'];
          return (async function* () {
            if (opts.promptError) throw opts.promptError;
            for (let i = 0; i < nextChunks.length; i++) {
              if (signal?.aborted) throw abortError();
              yield nextChunks[i];
              if (opts.holdStream && i === 0) {
                await new Promise<void>((resolve, reject) => {
                  streamWaiters.push(resolve);
                  signal?.addEventListener('abort', () => reject(abortError()));
                });
              }
            }
          })();
        }),
      };
      fake.sessions.push(session);
      return session;
    }),
  };

  (globalThis as { LanguageModel?: unknown }).LanguageModel = {
    availability: fake.availability,
    create: fake.create,
  };
  return fake;
}

export function uninstallFakeLanguageModel(): void {
  delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
}
