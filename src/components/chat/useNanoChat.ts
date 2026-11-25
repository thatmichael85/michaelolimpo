import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getLanguageModel,
  NANO_OPTIONS,
  type LanguageModelSession,
  type UsableAvailability,
} from './languageModel';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  error?: boolean;
}

/** idle = no session yet; preparing = create() in flight; replying = waiting on/streaming an answer. */
export type ChatPhase = 'idle' | 'preparing' | 'ready' | 'replying';

export interface NanoChat {
  phase: ChatPhase;
  /** True while Chrome still has to download Nano and no session has ever been created. */
  needsDownload: boolean;
  /** 0..1 from Chrome's download monitor while preparing, else null. */
  downloadProgress: number | null;
  messages: ChatMessage[];
  /** Setup failure text; cleared on the next prepare(). */
  notice: string | null;
  /** Idempotent. Must be called from a user gesture (focus/click): it may start Chrome's download. */
  prepare(): void;
  ask(question: string): void;
  stop(): void;
  clear(): void;
}

export const SETUP_NOTICE = "Couldn't start Chrome's on-device AI. Try again.";
export const REPLY_ERROR = 'Sorry, something went wrong. Please try again.';
export const OVERFLOW_ERROR = 'This conversation got too long. Press Clear to start over.';

const errorName = (e: unknown) => (e as { name?: string } | null)?.name;

export function useNanoChat(availability: UsableAvailability, systemPrompt: string): NanoChat {
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [hadSession, setHadSession] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const sessionRef = useRef<LanguageModelSession | null>(null);
  const creatingRef = useRef<Promise<LanguageModelSession> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const replyingRef = useRef(false);
  /** Bumped by clear(); replies from an older generation are discarded. */
  const generationRef = useRef(0);
  const nextIdRef = useRef(0);
  const unmountedRef = useRef(false);

  const getSession = useCallback((): Promise<LanguageModelSession> => {
    if (sessionRef.current) return Promise.resolve(sessionRef.current);
    if (creatingRef.current) return creatingRef.current;
    const api = getLanguageModel();
    if (!api) return Promise.reject(new Error('Prompt API unavailable'));

    setNotice(null);
    setPhase((p) => (p === 'replying' ? p : 'preparing'));
    const creating = api
      .create({
        ...NANO_OPTIONS,
        initialPrompts: [{ role: 'system', content: systemPrompt }],
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => setDownloadProgress(e.loaded));
        },
      })
      .then(
        (session) => {
          creatingRef.current = null;
          if (unmountedRef.current) {
            session.destroy();
            return session;
          }
          sessionRef.current = session;
          setHadSession(true);
          setDownloadProgress(null);
          setPhase((p) => (p === 'preparing' ? 'ready' : p));
          return session;
        },
        (err: unknown) => {
          creatingRef.current = null;
          setDownloadProgress(null);
          setNotice(SETUP_NOTICE);
          setPhase((p) => (p === 'preparing' ? 'idle' : p));
          throw err;
        },
      );
    creatingRef.current = creating;
    return creating;
  }, [systemPrompt]);

  const prepare = useCallback(() => {
    getSession().catch(() => {});
  }, [getSession]);

  const ask = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text || replyingRef.current) return;
      replyingRef.current = true;
      const generation = generationRef.current;
      const userId = nextIdRef.current++;
      const replyId = nextIdRef.current++;
      const controller = new AbortController();
      abortRef.current = controller;
      setMessages((ms) => [
        ...ms,
        { id: userId, role: 'user', text },
        { id: replyId, role: 'assistant', text: '' },
      ]);
      setPhase('replying');

      const updateReply = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((ms) => ms.map((m) => (m.id === replyId ? fn(m) : m)));
      const isCurrent = () => generation === generationRef.current && !unmountedRef.current;

      void (async () => {
        try {
          const session = await getSession();
          for await (const chunk of session.promptStreaming(text, { signal: controller.signal })) {
            if (!isCurrent()) return;
            updateReply((m) => ({ ...m, text: m.text + chunk }));
          }
        } catch (e) {
          if (!isCurrent() || errorName(e) === 'AbortError') return; // Stop keeps the partial answer
          const msg = errorName(e) === 'QuotaExceededError' ? OVERFLOW_ERROR : REPLY_ERROR;
          updateReply((m) => ({ ...m, error: true, text: msg }));
        } finally {
          if (isCurrent()) {
            replyingRef.current = false;
            abortRef.current = null;
            setPhase(sessionRef.current ? 'ready' : 'idle');
          }
        }
      })();
    },
    [getSession],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    generationRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    replyingRef.current = false;
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setMessages([]);
    setPhase(creatingRef.current ? 'preparing' : 'idle');
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      abortRef.current?.abort();
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  return {
    phase,
    needsDownload: availability !== 'available' && !hadSession,
    downloadProgress,
    messages,
    notice,
    prepare,
    ask,
    stop,
    clear,
  };
}
