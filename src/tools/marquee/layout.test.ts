import { describe, expect, it } from 'vitest';
import { BULB_STEP_MS, balanceLines, blinkPeriodMs, bulbPositions, fitScale, scrollDurationMs, scrollRate, wrapToWidth, chooseLines } from './layout';

describe('fitScale', () => {
  it('fits within 92% width and 85% height', () => {
    expect(fitScale({ w: 200, h: 50 }, { w: 1000, h: 500 }, 'both')).toBeCloseTo(4.6);
  });

  it('only fits height for horizontally scrolling text', () => {
    expect(fitScale({ w: 200, h: 50 }, { w: 1000, h: 500 }, 'height')).toBeCloseTo(8.5);
  });

  it('returns 1 for unmeasured content', () => {
    expect(fitScale({ w: 0, h: 0 }, { w: 1000, h: 500 }, 'both')).toBe(1);
  });
});

describe('scroll speed', () => {
  it('moves 0.075 display heights per second per speed step, up to 1.5 at speed 20', () => {
    expect(scrollRate(1)).toBeCloseTo(0.075);
    expect(scrollRate(20)).toBeCloseTo(1.5);
    expect(Math.round(scrollDurationMs(1640, 820, 20))).toBe(1333);
  });
});

describe('flashing cap', () => {
  it('keeps blink and bulb chase at or under 3 flashes per second', () => {
    expect(blinkPeriodMs('off')).toBeNull();
    expect(blinkPeriodMs('slow')).toBe(1000);
    expect(blinkPeriodMs('fast')!).toBeGreaterThanOrEqual(1000 / 3);
    expect(BULB_STEP_MS).toBeGreaterThanOrEqual(1000 / 3);
  });
});

describe('balanceLines', () => {
  const widthOf = (s: string) => [...s].length * 10;

  it('wraps a still sign onto the line count that gives the biggest text', () => {
    const lines = balanceLines('WE LOVE YOU 💜', widthOf, 12, { w: 460, h: 320 });
    expect(lines).toHaveLength(3);
    expect(lines.join(' ')).toBe('WE LOVE YOU 💜');
  });

  it('keeps a short message on one line', () => {
    expect(balanceLines('HI', widthOf, 12, { w: 460, h: 320 })).toEqual(['HI']);
  });

  it('respects line breaks the user typed', () => {
    expect(balanceLines('GO\nTEAM GO', widthOf, 12, { w: 460, h: 320 })).toEqual(['GO', 'TEAM GO']);
  });
});

describe('wrapToWidth', () => {
  const widthOf = (s: string) => [...s].length * 10;

  it('wraps words onto new lines instead of shrinking the text', () => {
    expect(wrapToWidth('GO GO 🎸🔥', widthOf, 60)).toEqual(['GO GO', '🎸🔥']);
  });

  it('keeps typed line breaks and leaves a too-long single word on its own line', () => {
    expect(wrapToWidth('HI\nSUPERCALIFRAGILISTIC', widthOf, 60)).toEqual(['HI', 'SUPERCALIFRAGILISTIC']);
  });
});

describe('chooseLines', () => {
  it('keeps the requested size when the wrapped text fits', () => {
    const widthOf = (t: string) => [...t].length * 10;
    expect(chooseLines('Hello GO 123 ✨', widthOf, 40, { w: 460, h: 320 }, false)).toEqual({ lines: ['Hello GO 123 ✨'], lineH: 40 });
  });

  it('switches to the biggest balanced layout when the wrap would be too tall, never smaller lines than needed', () => {
    const widthOf = (t: string) => [...t].length * 50;
    expect(chooseLines('Hello GO 123 ✨', widthOf, 200, { w: 460, h: 320 }, false)).toEqual({ lines: ['Hello GO', '123 ✨'], lineH: 152 });
  });

  it('fit fills the height with balanced lines', () => {
    const widthOf = (t: string) => [...t].length * 10;
    const { lines, lineH } = chooseLines('WE LOVE YOU 💜', widthOf, 12, { w: 460, h: 320 }, true);
    expect(lines).toHaveLength(3);
    expect(lineH).toBeCloseTo((0.85 * 320) / 3);
  });
});

describe('bulbPositions', () => {
  it('spaces bulbs evenly around the perimeter without duplicates', () => {
    const pts = bulbPositions(100, 50, 25, 0);
    expect(pts).toHaveLength(12);
    expect(new Set(pts.map((p) => `${p.x},${p.y}`)).size).toBe(12);
    for (const { x, y } of pts) {
      expect(x === 0 || x === 100 || y === 0 || y === 50).toBe(true);
    }
  });

  it('respects the inset', () => {
    const pts = bulbPositions(100, 50, 25, 5);
    expect(Math.min(...pts.map((p) => p.x))).toBe(5);
    expect(Math.max(...pts.map((p) => p.y))).toBe(45);
  });
});
