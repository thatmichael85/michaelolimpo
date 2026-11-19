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

/** Scroll speed in display heights per second, so preview and full screen look the same. */
export function scrollRate(speed: number): number {
  return 0.15 * speed;
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
