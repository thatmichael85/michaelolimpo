import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Card } from '../../design-system/primitives/Card';
import { Button } from '../../design-system/primitives/Button';
import { Heading } from '../../design-system/primitives/Heading';
import { Text } from '../../design-system/primitives/Text';
import { useNanoChat } from './useNanoChat';
import { SYSTEM_PROMPT } from './systemPrompt';
import type { UsableAvailability } from './languageModel';

const STARTERS = ['What does Michael do?', 'What has he built?', 'How can I reach him?'];

/** Homepage chat about Michael, answered by Chrome's on-device Gemini Nano. Lazy-loaded. */
export default function ChatPanel({ availability }: { availability: UsableAvailability }) {
  const chat = useNanoChat(availability, SYSTEM_PROMPT);
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const replying = chat.phase === 'replying';

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chat.messages]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (replying || !draft.trim()) return;
    chat.ask(draft);
    setDraft('');
  };

  const askStarter = (q: string) => {
    chat.prepare();
    chat.ask(q);
  };

  return (
    <Card className="chat-panel">
      <section aria-label="Chat about Michael" className="chat-section">
        <Heading level={2} className="chat-title">
          💬 Ask about Michael
        </Heading>
        {chat.needsDownload && (
          <Text variant="secondary" className="chat-note">
            Chrome&apos;s built-in AI downloads once, the first time you ask.
          </Text>
        )}
        {chat.downloadProgress !== null && (
          <progress className="chat-progress" max={1} value={chat.downloadProgress} aria-label="Downloading Chrome's AI" />
        )}
        {chat.notice && (
          <Text variant="secondary" role="status" className="chat-note">
            {chat.notice}
          </Text>
        )}

        <div ref={logRef} role="log" aria-live="polite" className="chat-log">
          {chat.messages.length === 0 && (
            <div className="chat-starters">
              {STARTERS.map((q) => (
                <Button key={q} variant="secondary" size="sm" onClick={() => askStarter(q)}>
                  {q}
                </Button>
              ))}
            </div>
          )}
          {chat.messages.map((m) => (
            <div key={m.id} className={`chat-msg chat-msg--${m.role}${m.error ? ' chat-msg--error' : ''}`}>
              {m.text.trimEnd() || '…'}
            </div>
          ))}
        </div>

        <form className="chat-form" onSubmit={onSubmit}>
          <input
            className="chat-input"
            aria-label="Your question"
            placeholder="Ask about Michael…"
            maxLength={500}
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={chat.prepare}
          />
          {replying ? (
            <Button variant="secondary" onClick={chat.stop}>
              Stop
            </Button>
          ) : null}
          <Button type="submit" disabled={replying}>
            Send
          </Button>
        </form>

        <div className="chat-footer">
          <Text variant="secondary" className="chat-disclaimer">
            Runs in your browser with Chrome&apos;s built-in AI. Your questions aren&apos;t sent to this site. Answers may be wrong.
          </Text>
          <Button variant="ghost" size="sm" onClick={chat.clear}>
            Clear
          </Button>
        </div>
      </section>
    </Card>
  );
}
