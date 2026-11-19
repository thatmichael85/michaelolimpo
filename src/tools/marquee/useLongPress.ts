import { useEffect, useRef, type PointerEvent } from 'react';

/** Movement beyond this cancels the hold, so a brush or bump in the crowd doesn't count. */
const SLOP_PX = 12;

export function useLongPress(onLong: () => void, ms = 1000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef(onLong);
  useEffect(() => {
    latest.current = onLong;
  });

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);

  return {
    onPointerDown: (e: PointerEvent) => {
      cancel();
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        timer.current = null;
        latest.current();
      }, ms);
    },
    onPointerMove: (e: PointerEvent) => {
      if (!timer.current) return;
      if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > SLOP_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
