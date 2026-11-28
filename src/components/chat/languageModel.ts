/**
 * Minimal typings and helpers for Chrome's built-in Prompt API (Gemini Nano).
 * https://developer.chrome.com/docs/ai/prompt-api — stable for web pages since Chrome 148.
 */

export type NanoAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';
export type UsableAvailability = Exclude<NanoAvailability, 'unavailable'>;

export interface LanguageModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DownloadMonitor {
  addEventListener(type: 'downloadprogress', cb: (e: { loaded: number }) => void): void;
}

export interface LanguageModelSession {
  promptStreaming(input: string, options?: { signal?: AbortSignal }): AsyncIterable<string>;
  destroy(): void;
}

/** English text in and out. Passed to both availability() and create(). */
export const NANO_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
} as const satisfies Record<string, ReadonlyArray<{ type: 'text'; languages: readonly string[] }>>;

export type NanoOptions = typeof NANO_OPTIONS;

export interface LanguageModelStatic {
  availability(options: NanoOptions): Promise<NanoAvailability>;
  create(
    options: NanoOptions & {
      initialPrompts?: LanguageModelMessage[];
      monitor?: (m: DownloadMonitor) => void;
      signal?: AbortSignal;
    },
  ): Promise<LanguageModelSession>;
}

export function getLanguageModel(): LanguageModelStatic | undefined {
  return (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel;
}

/** What Chrome says about Gemini Nano on this device; 'unavailable' if the API is missing or errors. */
export async function checkNanoAvailability(): Promise<NanoAvailability> {
  const api = getLanguageModel();
  if (!api) return 'unavailable';
  try {
    return await api.availability(NANO_OPTIONS);
  } catch {
    return 'unavailable';
  }
}
