import type { CSSProperties } from 'react';
import { FONTS, type Settings } from './settings';

export function fontCss(s: Settings): CSSProperties {
  return {
    fontFamily: `${FONTS[s.font].family}, system-ui, sans-serif`,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? 'italic' : 'normal',
    letterSpacing: `${s.letterSpacing}em`,
  };
}

let measureCtx: (CanvasRenderingContext2D & { letterSpacing?: string }) | null | undefined;

/** Measures text widths in the sign's font at `px` (null where canvas is unavailable). */
export function textMeasurer(s: Settings, px: number): ((text: string) => number) | null {
  if (measureCtx === undefined) measureCtx = document.createElement('canvas').getContext('2d');
  const ctx = measureCtx;
  if (!ctx) return null;
  ctx.font = fontShorthand(s, px);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${s.letterSpacing * px}px`;
  return (text) => ctx.measureText(text).width;
}

/** CSS font shorthand for canvas and document.fonts.load. */
export function fontShorthand(s: Settings, px: number): string {
  return `${s.italic ? 'italic ' : ''}${s.bold ? 700 : 400} ${px}px ${FONTS[s.font].family}, system-ui, sans-serif`;
}
