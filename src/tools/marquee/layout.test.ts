import { describe, expect, it } from 'vitest';
import { BULB_STEP_MS, blinkPeriodMs, bulbPositions, fitScale, scrollDurationMs, scrollRate } from './layout';

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
  it('moves 0.15 display heights per second per speed step', () => {
    expect(scrollRate(10)).toBeCloseTo(1.5);
    expect(Math.round(scrollDurationMs(1640, 820, 10))).toBe(1333);
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
