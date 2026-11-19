import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, FONTS, MAX_TEXT, sanitize } from './settings';
import { applyPreset, randomStyle, resetStyle } from './presets';
import { loadSettings, saveSettings } from './storage';

function memoryStore() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe('sanitize', () => {
  it('returns the defaults for missing data', () => {
    expect(sanitize(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('defaults to a readable scrolling smooth sign', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      render: 'smooth',
      scroll: 'left',
      blink: 'off',
      glow: true,
      border: { style: 'none' },
      background: { color: '#000000' },
    });
  });

  it('clamps numbers, rejects unknown enums and caps text length', () => {
    const s = sanitize({ size: 999, dotRows: 2, speed: -3, font: 'comic', text: 'x'.repeat(600), scroll: 'sideways' });
    expect(s.size).toBe(100);
    expect(s.dotRows).toBe(12);
    expect(s.speed).toBe(1);
    expect(s.font).toBe(DEFAULT_SETTINGS.font);
    expect(s.text).toHaveLength(MAX_TEXT);
    expect(s.scroll).toBe(DEFAULT_SETTINGS.scroll);
  });

  it('offers 20 speed steps', () => {
    expect(sanitize({ speed: 25 }).speed).toBe(20);
    expect(sanitize({ speed: 13 }).speed).toBe(13);
  });

  it('keeps the default colour when a colour is not #rrggbb', () => {
    const s = sanitize({ version: 7, color: 'red', border: { color: '#12345' } });
    expect(s.color).toBe(DEFAULT_SETTINGS.color);
    expect(s.border.color).toBe(DEFAULT_SETTINGS.border.color);
    expect(s.version).toBe(1);
  });

  it('keeps valid nested values while repairing invalid siblings', () => {
    const s = sanitize({ background: { kind: 'gradient', color: '#ff0000', angle: 'x' } });
    expect(s.background).toEqual({ ...DEFAULT_SETTINGS.background, kind: 'gradient', color: '#ff0000' });
  });
});

describe('blink', () => {
  it('defaults to steady with a 1 s cycle, half visible', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ blink: 'off', blinkMs: 1000, blinkDuty: 50 });
  });

  it('keeps the cycle at or above 0.4 s (no more than 3 flashes a second) and snaps to slider steps', () => {
    expect(sanitize({ blink: 'on', blinkMs: 100, blinkDuty: 95 })).toMatchObject({ blink: 'on', blinkMs: 400, blinkDuty: 90 });
    expect(sanitize({ blinkMs: 1234, blinkDuty: 33 })).toMatchObject({ blinkMs: 1200, blinkDuty: 30 });
    expect(sanitize({ blinkMs: 9000, blinkDuty: 1 })).toMatchObject({ blinkMs: 3000, blinkDuty: 10 });
  });

  it('carries over signs saved with the old Slow / Fast blink', () => {
    expect(sanitize({ blink: 'slow' })).toMatchObject({ blink: 'on', blinkMs: 1000, blinkDuty: 50 });
    expect(sanitize({ blink: 'fast' })).toMatchObject({ blink: 'on', blinkMs: 400, blinkDuty: 50 });
  });
});

describe('fonts', () => {
  it('offers everyday system fonts alongside the display fonts', () => {
    expect(Object.keys(FONTS)).toEqual(expect.arrayContaining(['sans', 'rounded', 'serif', 'mono', 'bebas']));
    expect(sanitize({ font: 'serif' }).font).toBe('serif');
  });
});

describe('storage', () => {
  it('falls back to defaults for corrupt or missing data', () => {
    expect(loadSettings({ getItem: () => '{not json' })).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings({ getItem: () => null })).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', () => {
    const store = memoryStore();
    const s = { ...DEFAULT_SETTINGS, text: 'WE LOVE YOU 💜', speed: 7 };
    saveSettings(store, s);
    expect(loadSettings(store)).toEqual(s);
  });

  it('ignores storage write failures', () => {
    const throwing = { setItem: () => { throw new Error('quota'); } };
    expect(() => saveSettings(throwing, DEFAULT_SETTINGS)).not.toThrow();
  });
});

describe('presets', () => {
  it('applies a preset but keeps the message', () => {
    const s = applyPreset({ ...DEFAULT_SETTINGS, text: 'HI' }, 'stadium');
    expect(s.text).toBe('HI');
    expect(s.render).toBe('led');
  });

  it('resets styling to defaults but keeps the message', () => {
    const s = resetStyle({ ...DEFAULT_SETTINGS, text: 'HI', color: '#ff0000', render: 'pixel' });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, text: 'HI' });
  });
});

/** Deterministic pseudo-random sequence for tests. */
function seeded(seed: number) {
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  // Small seeds give tiny first values; skip a few so every pick varies.
  for (let i = 0; i < 5; i++) next();
  return next;
}

describe('randomStyle', () => {
  it('never touches the message text', () => {
    expect(randomStyle({ ...DEFAULT_SETTINGS, text: 'KEEP 💜\nME' }, seeded(1)).text).toBe('KEEP 💜\nME');
  });

  it('always produces valid settings', () => {
    for (let i = 1; i <= 50; i++) {
      const r = randomStyle(DEFAULT_SETTINGS, seeded(i));
      expect(sanitize(r)).toEqual(r);
    }
  });

  it('varies the look between rolls', () => {
    const fonts = new Set(Array.from({ length: 30 }, (_, i) => randomStyle(DEFAULT_SETTINGS, seeded(i + 1)).font));
    const renders = new Set(Array.from({ length: 30 }, (_, i) => randomStyle(DEFAULT_SETTINGS, seeded(i + 1)).render));
    expect(fonts.size).toBeGreaterThan(4);
    expect(renders.size).toBe(3);
  });

  it('keeps it readable: bright text on a dark background', () => {
    const luminance = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    };
    for (let i = 1; i <= 50; i++) {
      const r = randomStyle(DEFAULT_SETTINGS, seeded(i));
      expect(luminance(r.color) - luminance(r.background.color)).toBeGreaterThan(0.35);
    }
  });
});
