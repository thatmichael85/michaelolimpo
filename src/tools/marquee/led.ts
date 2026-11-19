/** A grid of LED cells: RGBA per cell, alpha 0 = off, 255 = lit. */
export interface CellGrid {
  cols: number;
  rows: number;
  data: Uint8ClampedArray;
}

interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Averages each block of source pixels into one cell; a cell is lit when coverage ≥ threshold. */
export function sampleCells(src: Pixels, cols: number, rows: number, threshold = 0.45 * 255): CellGrid {
  const data = new Uint8ClampedArray(cols * rows * 4);
  for (let r = 0; r < rows; r++) {
    const y0 = Math.floor((r * src.height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * src.height) / rows));
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor((c * src.width) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((c + 1) * src.width) / cols));
      let red = 0, green = 0, blue = 0, alpha = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = (y * src.width + x) * 4;
          const a = src.data[i + 3];
          red += src.data[i] * a;
          green += src.data[i + 1] * a;
          blue += src.data[i + 2] * a;
          alpha += a;
        }
      if (alpha / ((x1 - x0) * (y1 - y0)) < threshold) continue;
      data.set([red / alpha, green / alpha, blue / alpha, 255], (r * cols + c) * 4);
    }
  }
  return { cols, rows, data };
}

/**
 * Cross-fades two neighbouring scroll positions (f = 0 → a, 1 → b). The dots stay put but
 * brighten and dim as text passes, so motion glides instead of jumping a dot at a time.
 */
export function blendCells(a: CellGrid, b: CellGrid, f: number): CellGrid {
  const data = new Uint8ClampedArray(a.data.length);
  for (let i = 0; i < data.length; i += 4) {
    const wa = ((1 - f) * a.data[i + 3]) / 255;
    const wb = (f * b.data[i + 3]) / 255;
    const w = wa + wb;
    if (w === 0) continue;
    data[i] = (a.data[i] * wa + b.data[i] * wb) / w;
    data[i + 1] = (a.data[i + 1] * wa + b.data[i + 1] * wb) / w;
    data[i + 2] = (a.data[i + 2] * wa + b.data[i + 2] * wb) / w;
    data[i + 3] = w * 255;
  }
  return { cols: a.cols, rows: a.rows, data };
}

/** The gap after the text equals the view, so the text fully exits before it re-enters. */
export function stripLength(textCells: number, viewCells: number): { period: number; gap: number } {
  return { gap: viewCells, period: textCells + viewCells };
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The cells visible in a view at a scroll offset, looping with period strip + gap. */
export function windowCells(
  strip: CellGrid,
  view: { cols: number; rows: number },
  offset: number,
  axis: 'x' | 'y',
  gap: number,
): CellGrid {
  const data = new Uint8ClampedArray(view.cols * view.rows * 4);
  const period = (axis === 'x' ? strip.cols : strip.rows) + gap;
  for (let r = 0; r < view.rows; r++)
    for (let c = 0; c < view.cols; c++) {
      const sc = axis === 'x' ? mod(offset + c, period) : c;
      const sr = axis === 'y' ? mod(offset + r, period) : r;
      if (sc >= strip.cols || sr >= strip.rows) continue;
      const from = (sr * strip.cols + sc) * 4;
      data.set(strip.data.subarray(from, from + 4), (r * view.cols + c) * 4);
    }
  return { cols: view.cols, rows: view.rows, data };
}
