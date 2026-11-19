import { useEffect, useRef, useState } from 'react';
import type { Settings } from '../settings';
import { useLongPress } from '../useLongPress';
import { useWakeLock } from '../useWakeLock';
import { Display } from './Display';

const EDIT_VISIBLE_MS = 4000;
const HINT_VISIBLE_MS = 3000;

type FsDocument = Document & { webkitFullscreenElement?: Element | null };

/** Full-screen sign. No visible controls; press and hold (or Esc) to get back to Setup. */
export function PlayView({ settings, onExit }: { settings: Settings; onExit: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const press = useLongPress(() => setShowEdit(true));
  const exit = useRef(onExit);
  useEffect(() => {
    exit.current = onExit;
  });
  useWakeLock(true);

  useEffect(() => {
    if (!showEdit) return;
    const t = setTimeout(() => setShowEdit(false), EDIT_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [showEdit]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), HINT_VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  // Keyboard Esc, or leaving browser full screen (which Esc also does), goes back to Setup.
  useEffect(() => {
    const doc = document as FsDocument;
    let wasFullscreen = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit.current();
    };
    const onFullscreen = () => {
      const now = !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
      if (wasFullscreen && !now) exit.current();
      wasFullscreen = now;
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('webkitfullscreenchange', onFullscreen);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('webkitfullscreenchange', onFullscreen);
    };
  }, []);

  return (
    <div className="mq-play" data-testid="mq-play" {...press} onContextMenu={(e) => e.preventDefault()}>
      <Display settings={settings} />
      {showHint && !showEdit && <div className="mq-play-hint">Press and hold anywhere to edit</div>}
      {showEdit && (
        <button type="button" className="mq-btn mq-edit" onPointerDown={(e) => e.stopPropagation()} onClick={onExit}>
          Edit
        </button>
      )}
    </div>
  );
}
