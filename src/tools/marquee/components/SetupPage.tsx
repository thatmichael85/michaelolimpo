import { useEffect, useState } from 'react';
import { MAX_TEXT } from '../settings';
import type { SettingsApi } from '../useSettings';
import { Display } from './Display';
import { DisplayPanel } from './DisplayPanel';
import { PresetsMenu } from './PresetsMenu';
import { TextPanel } from './TextPanel';

const RESET_ARM_MS = 3000;

export function SetupPage({ settings, update, preset, reset, randomize, onPlay }: SettingsApi & { onPlay: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), RESET_ARM_MS);
    return () => clearTimeout(t);
  }, [armed]);

  const onReset = () => {
    if (armed) reset();
    setArmed(!armed);
  };

  return (
    <main className="mq-setup">
      <header className="mq-header">
        <h1 className="mq-title">Marquee</h1>
        <p className="mq-hint">Tip: Add to Home Screen for full screen, and set Auto-Lock to Never before the show.</p>
      </header>

      <div className="mq-preview" aria-label="Preview">
        <Display settings={settings} />
      </div>

      <label className="mq-message">
        <span className="mq-label">Message</span>
        <textarea
          value={settings.text}
          maxLength={MAX_TEXT}
          rows={2}
          placeholder="Type your sign… emojis welcome 🎉"
          onChange={(e) => update({ text: e.target.value })}
        />
      </label>

      <div className="mq-panels">
        <TextPanel settings={settings} update={update} />
        <DisplayPanel settings={settings} update={update} />
      </div>

      <footer className="mq-actions">
        <PresetsMenu onPick={preset} />
        <span className="mq-spacer" />
        <button type="button" className="mq-btn" aria-label="Randomize" onClick={randomize}>
          <span className="mq-btn__icon" aria-hidden="true">🎲</span>Randomize
        </button>
        <button type="button" className={`mq-btn${armed ? ' mq-btn--danger' : ''}`} onClick={onReset}>
          {armed ? 'Tap again to reset' : 'Reset'}
        </button>
        <button type="button" className="mq-btn mq-btn--play" disabled={!settings.text.trim()} onClick={onPlay}>
          ▶ Play
        </button>
      </footer>
    </main>
  );
}
