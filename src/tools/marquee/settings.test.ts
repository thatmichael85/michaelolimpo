import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, FONTS, MAX_TEXT, sanitize } from './settings';
import { applyPreset, resetStyle } from './presets';
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
