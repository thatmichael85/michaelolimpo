import { useEffect, useId, useRef, useState } from 'react';
import { PRESETS, type PresetId } from '../presets';

/** A "Presets" button that opens a popover of presets above it. */
export function PresetsMenu({ onPick }: { onPick: (id: PresetId) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="mq-presets" ref={rootRef}>
      <button
        type="button"
        className="mq-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
      >
        Presets
      </button>
      {open && (
        <div id={menuId} className="mq-popover" role="menu" aria-label="Presets">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              className="mq-popover__item"
              onClick={() => {
                onPick(id);
                setOpen(false);
              }}
            >
              {PRESETS[id].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
