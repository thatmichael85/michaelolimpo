import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * FLIP: when `layoutKey` changes and the element lands somewhere else, animate it from where
 * it was, so the profile card slides aside for the chat instead of jumping. No-op under reduced motion.
 */
export function useSlideOnChange(ref: RefObject<HTMLElement | null>, layoutKey: unknown) {
  const last = useRef<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    const prev = last.current;
    last.current = { left, top };
    if (!prev) return;
    const dx = prev.left - left;
    const dy = prev.top - top;
    if (!dx && !dy) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    el.animate?.([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: 250,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    });
  }, [ref, layoutKey]);
}
