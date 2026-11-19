import { useEffect, useState } from 'react';
import type { Settings } from '../settings';
import { useLongPress } from '../useLongPress';
import { useWakeLock } from '../useWakeLock';
import { Display } from './Display';

const EDIT_VISIBLE_MS = 4000;

/** Full-screen sign. No visible controls; press and hold to reveal Edit. */
export function PlayView({ settings, onExit }: { settings: Settings; onExit: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const press = useLongPress(() => setShowEdit(true));
  useWakeLock(true);

  useEffect(() => {
    if (!showEdit) return;
    const t = setTimeout(() => setShowEdit(false), EDIT_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [showEdit]);

  return (
    <div className="mq-play" data-testid="mq-play" {...press} onContextMenu={(e) => e.preventDefault()}>
      <Display settings={settings} />
      {showEdit && (
        <button type="button" className="mq-btn mq-edit" onPointerDown={(e) => e.stopPropagation()} onClick={onExit}>
          Edit
        </button>
      )}
    </div>
  );
}
