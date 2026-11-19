import { describe, expect, it } from 'vitest';
import { sampleCells, stripLength, windowCells, type CellGrid } from './led';

/** Builds an RGBA image where `paint(x, y)` returns [r,g,b,a] or null for transparent. */
function image(width: number, height: number, paint: (x: number, y: number) => number[] | null) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const px = paint(x, y);
      if (px) data.set(px, (y * width + x) * 4);
    }
  return { width, height, data };
}

const cell = (g: CellGrid, c: number, r: number) => Array.from(g.data.slice((r * g.cols + c) * 4, (r * g.cols + c) * 4 + 4));

describe('sampleCells', () => {
  it('lights cells that are covered and keeps their colour', () => {
    const src = image(4, 2, (x) => (x < 2 ? [255, 0, 0, 255] : null));
    const g = sampleCells(src, 2, 1);
    expect(cell(g, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(cell(g, 1, 0)[3]).toBe(0);
  });

  it('uses a coverage threshold so half-covered edges snap on or off', () => {
    // 10x1 cell; 4 of 10 pixels covered stays off, 6 of 10 lights up.
    expect(cell(sampleCells(image(10, 1, (x) => (x < 4 ? [0, 255, 0, 255] : null)), 1, 1), 0, 0)[3]).toBe(0);
    expect(cell(sampleCells(image(10, 1, (x) => (x < 6 ? [0, 255, 0, 255] : null)), 1, 1), 0, 0)).toEqual([0, 255, 0, 255]);
  });

  it('allocates memory per cell, not per source pixel', () => {
    const g = sampleCells(image(4000, 96, () => null), 1000, 24);
    expect(g.data.length).toBe(1000 * 24 * 4);
  });
});

describe('windowCells', () => {
  const strip: CellGrid = sampleCells(image(3, 1, () => [9, 9, 9, 255]), 3, 1);

  it('shows the strip then blank gap cells', () => {
    const w = windowCells(strip, { cols: 5, rows: 1 }, 0, 'x', 5);
    expect([0, 1, 2].map((c) => cell(w, c, 0)[3])).toEqual([255, 255, 255]);
    expect([3, 4].map((c) => cell(w, c, 0)[3])).toEqual([0, 0]);
  });

  it('loops with period strip + gap', () => {
    const a = windowCells(strip, { cols: 5, rows: 1 }, 0, 'x', 5);
    const b = windowCells(strip, { cols: 5, rows: 1 }, 8, 'x', 5);
    expect(Array.from(b.data)).toEqual(Array.from(a.data));
  });

  it('handles negative offsets (scrolling right/down)', () => {
    const w = windowCells(strip, { cols: 5, rows: 1 }, -1, 'x', 5);
    expect(cell(w, 0, 0)[3]).toBe(0);
    expect(cell(w, 1, 0)[3]).toBe(255);
  });

  it('scrolls vertically along rows', () => {
    const tall = sampleCells(image(1, 2, () => [1, 2, 3, 255]), 1, 2);
    const w = windowCells(tall, { cols: 1, rows: 3 }, 1, 'y', 3);
    expect([0, 1, 2].map((r) => cell(w, 0, r)[3])).toEqual([255, 0, 0]);
  });
});

describe('stripLength', () => {
  it('lets text fully exit before re-entering', () => {
    expect(stripLength(30, 100)).toEqual({ gap: 100, period: 130 });
  });
});
