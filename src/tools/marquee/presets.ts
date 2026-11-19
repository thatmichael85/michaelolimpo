import { DEFAULT_SETTINGS, type Settings } from './settings';

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

/** Restores default styling; the message text is kept. */
export function resetStyle(s: Settings): Settings {
  return { ...DEFAULT_SETTINGS, text: s.text };
}
