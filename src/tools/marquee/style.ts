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

/** CSS font shorthand for canvas and document.fonts.load. */
export function fontShorthand(s: Settings, px: number): string {
  return `${s.italic ? 'italic ' : ''}${s.bold ? 700 : 400} ${px}px ${FONTS[s.font].family}, system-ui, sans-serif`;
}
