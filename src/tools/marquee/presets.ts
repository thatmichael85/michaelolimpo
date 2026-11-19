import { DEFAULT_SETTINGS, FONTS, sanitize, type FontId, type Settings } from './settings';

export type PresetId = 'neon' | 'stadium' | 'classic';

const black = { kind: 'solid', color: '#000000', color2: '#2b0040', angle: 135 } as const;

export const PRESETS: Record<PresetId, { label: string; style: Partial<Settings> }> = {
  neon: {
    label: 'Neon',
    style: {
      render: 'smooth', font: 'monoton', color: '#ff4fd8', glow: true, outline: false, rainbow: false,
      background: { ...black }, border: { style: 'neon', color: '#22e4ff', width: 10 },
    },
  },
  stadium: {
    label: 'Stadium',
    style: {
      render: 'led', font: 'bungee', color: '#ffb000', unlit: 'faint', dotRows: 32, glow: true, rainbow: false,
      background: { ...black }, border: { style: 'none', color: '#ffd43b', width: 12 },
    },
  },
  classic: {
    label: 'Classic',
    style: {
      render: 'smooth', font: 'bebas', color: '#fff6d5', glow: true, outline: false, rainbow: false,
      background: { ...black, color: '#120a00' }, border: { style: 'bulbs', color: '#ffd43b', width: 18 },
    },
  },
};

/** Applies a preset's styling on top of the defaults; the message text is kept. */
export function applyPreset(s: Settings, id: PresetId): Settings {
  return { ...DEFAULT_SETTINGS, ...PRESETS[id].style, text: s.text };
}

// Randomize draws bright text colours over dark backgrounds so every roll stays readable.
const BRIGHT = ['#ffffff', '#fff6d5', '#ff5a5a', '#ffb000', '#fff200', '#3bff6a', '#22e4ff', '#ff4fd8', '#9b6bff'];
const DARK = ['#000000', '#120a00', '#0a0f2b', '#2b0040', '#05140c', '#1a0000'];

/** A random look within sensible ranges; the message text is kept. */
export function randomStyle(s: Settings, rand: () => number = Math.random): Settings {
  const pick = <T,>(options: readonly T[]): T => options[Math.floor(rand() * options.length)];
  const chance = (p: number) => rand() < p;
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const render = pick(['smooth', 'led', 'pixel'] as const);
  const bg = pick(DARK);
  return sanitize({
    ...s,
    font: pick(Object.keys(FONTS) as FontId[]),
    render,
    dotRows: int(20, 56),
    unlit: chance(0.7) ? 'faint' : 'off',
    size: int(45, 90),
    fit: chance(0.3),
    color: pick(BRIGHT),
    rainbow: chance(0.2),
    bold: chance(0.4),
    italic: chance(0.2),
    caps: chance(0.5),
    outline: render === 'smooth' && chance(0.2),
    glow: chance(0.8),
    letterSpacing: int(0, 10) / 100,
    background: {
      kind: chance(0.35) ? 'gradient' : 'solid',
      color: bg,
      color2: pick(DARK.filter((c) => c !== bg)),
      angle: int(0, 359),
    },
    border: { style: pick(['none', 'solid', 'neon', 'bulbs'] as const), color: pick(BRIGHT), width: int(6, 24) },
    scroll: pick(['left', 'left', 'right', 'up', 'down', 'off'] as const),
    speed: int(4, 14),
    blink: chance(0.85) ? 'off' : 'on',
    blinkMs: int(4, 20) * 100,
    blinkDuty: int(3, 9) * 10,
  });
}

/** Restores default styling; the message text is kept. */
export function resetStyle(s: Settings): Settings {
  return { ...DEFAULT_SETTINGS, text: s.text };
}
