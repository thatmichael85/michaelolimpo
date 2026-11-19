import { sampleCells, type CellGrid } from './led';
import type { Settings } from './settings';
import { fontShorthand } from './style';

/** Supersampling: each cell is drawn as SxS pixels, then averaged. */
const S = 4;
/** Keeps each scratch canvas well under iOS's canvas size limits, however long the message. */
const CHUNK_CELLS = 1024;
const RAINBOW = ['#ff3b3b', '#ffb000', '#fff200', '#3bff6a', '#22e4ff', '#9b6bff', '#ff3b3b'];

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

function scratch(w: number, h: number): Ctx | null {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c.getContext('2d', { willReadFrequently: true }) as Ctx | null;
}

/**
 * Draws the message into a grid of LED cells. Horizontal signs get a strip as wide
 * as the text (single line); static and vertical signs get a strip as wide as the view.
 */
export async function rasterizeText(s: Settings, view: { cols: number; rows: number }): Promise<CellGrid | null> {
  const horizontal = s.scroll === 'left' || s.scroll === 'right';
  const vertical = s.scroll === 'up' || s.scroll === 'down';
  const raw = s.caps ? s.text.toUpperCase() : s.text;
  const lines = horizontal ? [raw.replace(/\r?\n/g, ' ')] : raw.split(/\r?\n/);
  const measure = scratch(1, 1);
  if (!measure) return null;

  // Line height in cells, then font size in supersampled pixels.
  let lineCells = ((s.fit ? 85 : s.size) / 100) * view.rows / lines.length;
  const setFont = (ctx: Ctx, cells: number) => {
    ctx.font = fontShorthand(s, cells * S * 0.9);
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${s.letterSpacing * cells * S * 0.9}px`;
  };
  await document.fonts?.load(fontShorthand(s, 100), raw).catch(() => undefined);
  setFont(measure, lineCells);
  let widest = Math.max(1, ...lines.map((l) => measure.measureText(l).width));
  if (!horizontal && (s.fit || widest > view.cols * S)) {
    // Static/vertical text must fit the width of the board.
    const scale = Math.min(s.fit ? Infinity : 1, (view.cols * S * 0.92) / widest);
    lineCells *= s.fit ? Math.min(1, scale) : scale;
    setFont(measure, lineCells);
    widest = Math.max(1, ...lines.map((l) => measure.measureText(l).width));
  }

  const lineH = lineCells * S;
  const cols = horizontal ? Math.ceil(widest / S) + 2 : view.cols;
  const rows = vertical ? Math.max(1, Math.ceil(lines.length * lineCells)) : view.rows;
  const grid: CellGrid = { cols, rows, data: new Uint8ClampedArray(cols * rows * 4) };
  const top = (rows * S - lines.length * lineH) / 2;

  for (let c0 = 0; c0 < cols; c0 += CHUNK_CELLS) {
    const chunk = Math.min(CHUNK_CELLS, cols - c0);
    const ctx = scratch(chunk * S, rows * S);
    if (!ctx) return null;
    setFont(ctx, lineCells);
    ctx.textBaseline = 'middle';
    ctx.textAlign = horizontal ? 'left' : 'center';
    if (s.rainbow) {
      const g = ctx.createLinearGradient(-c0 * S, 0, (cols - c0) * S, 0);
      RAINBOW.forEach((color, i) => g.addColorStop(i / (RAINBOW.length - 1), color));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = s.color;
    }
    const x = horizontal ? S - c0 * S : (cols * S) / 2 - c0 * S;
    lines.forEach((line, i) => ctx.fillText(line, x, top + lineH * (i + 0.5)));
    const part = sampleCells(ctx.getImageData(0, 0, chunk * S, rows * S), chunk, rows);
    for (let r = 0; r < rows; r++)
      grid.data.set(part.data.subarray(r * chunk * 4, (r + 1) * chunk * 4), (r * cols + c0) * 4);
  }
  return grid;
}
