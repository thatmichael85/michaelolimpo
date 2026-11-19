import { chooseLines, wrapToWidth } from './layout';
import { sampleCells, type CellGrid } from './led';
import { FONTS, type Settings } from './settings';
import { fontShorthand } from './style';

/** Supersampling: each cell is drawn as SxS pixels, then averaged. */
const S = 4;
/** Keeps each scratch canvas well under iOS's canvas size limits, however long the message. */
const CHUNK_CELLS = 1024;
/** Capital letters fill this share of each line's height. */
const CAP = 0.7;
const RAINBOW =['#ff3b3b', '#ffb000', '#fff200', '#3bff6a', '#22e4ff', '#9b6bff', '#ff3b3b'];

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
  let lines = horizontal ? [raw.replace(/\r?\n/g, ' ')] : raw.split(/\r?\n/);
  const measure = scratch(1, 1);
  if (!measure) return null;

  await document.fonts?.load(fontShorthand(s, 100), raw).catch(() => undefined);
  // Size letters by their capital height (not the font's em box, which wastes rows on space).
  measure.font = fontShorthand(s, 100);
  const capRatio = Math.min(0.9, Math.max(0.5, measure.measureText('H').actualBoundingBoxAscent / 100 || 0.7));
  const lined = FONTS[s.font].lined === true;

  // Line height in cells; capitals fill CAP of each line.
  let lineCells = ((s.fit ? 85 : s.size) / 100) * view.rows / lines.length;
  const fontPx = (cells: number) => (CAP * cells * S) / capRatio;
  const setFont = (ctx: Ctx, cells: number) => {
    const px = fontPx(cells);
    ctx.font = fontShorthand(s, px);
    // At least one dot between letters, or neighbouring letters merge into blobs.
    // Bold and filled-in striped letters are heavier, so they need a dot more room.
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(s.letterSpacing * px, s.bold || lined ? 2 * S : S)}px`;
  };
  const widthOf = (l: string) => measure.measureText(l).width;
  setFont(measure, lineCells);
  if (vertical) {
    // Scrolling up/down: wrap onto more lines rather than shrinking the letters.
    lines = wrapToWidth(raw, widthOf, view.cols * S * 0.92);
  } else if (!horizontal) {
    const chosen = chooseLines(raw, widthOf, lineCells * S, { w: view.cols * S, h: view.rows * S }, s.fit);
    lines = chosen.lines;
    lineCells = chosen.lineH / S;
    setFont(measure, lineCells);
  }
  let widest = Math.max(1, ...lines.map(widthOf));
  if (!horizontal && (s.fit || widest > view.cols * S)) {
    // Whatever still overflows (a single long word) shrinks to fit the board's width.
    const scale = Math.min(s.fit ? Infinity : 1, (view.cols * S * 0.92) / widest);
    lineCells *= s.fit ? Math.min(1, scale) : scale;
    setFont(measure, lineCells);
    widest = Math.max(1, ...lines.map(widthOf));
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
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = horizontal ? 'left' : 'center';
    if (s.rainbow) {
      const g = ctx.createLinearGradient(-c0 * S, 0, (cols - c0) * S, 0);
      RAINBOW.forEach((color, i) => g.addColorStop(i / (RAINBOW.length - 1), color));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = s.color;
    }
    // A stroke thickens letters: Bold thickens strokes by about half a dot; striped fonts (Monoton), which alias into
    // noise at dot resolution, get their stripes filled solid.
    const strokeW = (s.bold ? S * 0.5 : 0) + (lined ? fontPx(lineCells) * 0.035 : 0);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = strokeW;
    ctx.lineJoin = 'round';
    const x = horizontal ? S - c0 * S : (cols * S) / 2 - c0 * S;
    lines.forEach((line, i) => {
      // Baseline placed so the capitals sit centred in their line.
      const y = top + lineH * (i + (1 + CAP) / 2);
      ctx.fillText(line, x, y);
      if (strokeW > 0) ctx.strokeText(line, x, y);
    });
    const part = sampleCells(ctx.getImageData(0, 0, chunk * S, rows * S), chunk, rows);
    for (let r = 0; r < rows; r++)
      grid.data.set(part.data.subarray(r * chunk * 4, (r + 1) * chunk * 4), (r * cols + c0) * 4);
  }
  return grid;
}
