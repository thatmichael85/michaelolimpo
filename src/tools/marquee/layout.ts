import type { BlinkRate } from './settings';

interface Size {
  w: number;
  h: number;
}

/** Largest scale at which content fits the box (92% width, 85% height). */
export function fitScale(content: Size, box: Size, axis: 'both' | 'height'): number {
  if (content.w <= 0 || content.h <= 0) return 1;
  const byHeight = (box.h * 0.85) / content.h;
  return axis === 'height' ? byHeight : Math.min(byHeight, (box.w * 0.92) / content.w);
}

/** Splits words into at most n lines, breaking near width/n. */
function splitInto(words: string[], n: number, widthOf: (s: string) => number): string[] {
  const target = widthOf(words.join(' ')) / n;
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    const overshoot = widthOf(next) - target;
    if (cur && lines.length < n - 1 && overshoot > target - widthOf(cur)) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  return [...lines, cur];
}

/**
 * For a still, fit-to-screen sign: wraps words onto the number of lines that makes the
 * text biggest in the box, so a long message doesn't shrink to an unreadable single line.
 * Line breaks the user typed are kept as-is.
 */
export function balanceLines(text: string, widthOf: (s: string) => number, lineH: number, box: Size, maxLines = 5): string[] {
  if (text.includes('\n')) return text.split(/\r?\n/);
  const words = text.trim().split(/\s+/).filter(Boolean);
  let best = [text.trim()];
  let bestScale = 0;
  for (let n = 1; n <= Math.min(maxLines, words.length); n++) {
    const lines = splitInto(words, n, widthOf);
    const widest = Math.max(1, ...lines.map(widthOf));
    const scale = Math.min((box.w * 0.92) / widest, (box.h * 0.85) / (lines.length * lineH));
    if (scale > bestScale) [best, bestScale] = [lines, scale];
  }
  return best;
}

/** Greedy word wrap at a fixed text size (typed line breaks kept; an over-long word gets its own line). */
export function wrapToWidth(text: string, widthOf: (s: string) => number, maxW: number): string[] {
  return text.split(/\r?\n/).flatMap((para) => {
    const lines: string[] = [];
    let cur = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && widthOf(next) > maxW) {
        lines.push(cur);
        cur = word;
      } else {
        cur = next;
      }
    }
    return [...lines, cur];
  });
}

/**
 * Lines and line height for a still sign. Fit fills the height with balanced lines; otherwise
 * the text wraps at the requested size, and only if that runs too tall does it switch to the
 * balanced layout that keeps the letters as big as possible.
 */
export function chooseLines(
  text: string,
  widthOf: (s: string) => number,
  lineH: number,
  box: Size,
  fit: boolean,
): { lines: string[]; lineH: number } {
  if (fit) {
    const lines = balanceLines(text, widthOf, lineH, box);
    return { lines, lineH: (0.85 * box.h) / lines.length };
  }
  const wrapped = wrapToWidth(text, widthOf, box.w * 0.92);
  if (wrapped.length * lineH <= box.h * 0.95) return { lines: wrapped, lineH };
  const lines = balanceLines(text, widthOf, lineH, box);
  return { lines, lineH: Math.min(lineH, (box.h * 0.95) / lines.length) };
}

/** Scroll speed in display heights per second, so preview and full screen look the same. */
export function scrollRate(speed: number): number {
  return 0.075 * speed;
}

export function scrollDurationMs(travel: number, displayH: number, speed: number): number {
  return (travel / (scrollRate(speed) * displayH)) * 1000;
}

/** Whole-sign flashing stays at or under 3 per second (photosensitivity guideline). */
export function blinkPeriodMs(rate: BlinkRate): number | null {
  return rate === 'off' ? null : rate === 'slow' ? 1000 : 400;
}

/** Each bulb toggles once per step, so ≥ 334 ms keeps the chase under 3 flashes/s. */
export const BULB_STEP_MS = 400;

/** Evenly spaced points walking clockwise around a rectangle, starting top-left. */
export function bulbPositions(w: number, h: number, spacing: number, inset: number): { x: number; y: number }[] {
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  if (iw <= 0 || ih <= 0 || spacing <= 0) return [];
  const perimeter = 2 * (iw + ih);
  const count = Math.max(4, Math.round(perimeter / spacing));
  const step = perimeter / count;
  const round = (n: number) => Math.round(n * 100) / 100;
  return Array.from({ length: count }, (_, i) => {
    let d = i * step;
    let x: number;
    let y: number;
    if (d < iw) [x, y] = [d, 0];
    else if ((d -= iw) < ih) [x, y] = [iw, d];
    else if ((d -= ih) < iw) [x, y] = [iw - d, ih];
    else [x, y] = [0, ih - (d - iw)];
    return { x: round(x + inset), y: round(y + inset) };
  });
}
