export type FontId =
  | 'sans' | 'rounded' | 'serif' | 'mono'
  | 'bebas' | 'anton' | 'bungee' | 'monoton' | 'pacifico' | 'pressstart';
export type RenderMode = 'smooth' | 'led' | 'pixel';
export type ScrollDir = 'off' | 'left' | 'right' | 'up' | 'down';
export type BorderStyle = 'none' | 'solid' | 'neon' | 'bulbs';
export type BlinkRate = 'off' | 'slow' | 'fast';

export interface Settings {
  version: 1;
  text: string;
  font: FontId;
  render: RenderMode;
  /** LED/PIXEL: number of dot rows on the display. */
  dotRows: number;
  unlit: 'off' | 'faint';
  /** Text height as a percentage of the display height. */
  size: number;
  fit: boolean;
  color: string;
  rainbow: boolean;
  bold: boolean;
  italic: boolean;
  caps: boolean;
  outline: boolean;
  glow: boolean;
  /** In em. */
  letterSpacing: number;
  background: { kind: 'solid' | 'gradient'; color: string; color2: string; angle: number };
  /** Border width is in px at full iPad height (820). */
  border: { style: BorderStyle; color: string; width: number };
  scroll: ScrollDir;
  speed: number;
  blink: BlinkRate;
}

export const MAX_TEXT = 500;

/** `lined`: the font is drawn with built-in stripes/outlines (Monoton), so Outline and heavy Glow don't apply. */
export const FONTS: Record<FontId, { label: string; family: string; lined?: boolean }> = {
  // Everyday fonts built into the iPad (no download, work offline).
  sans: { label: 'Sans', family: "system-ui, -apple-system, 'Helvetica Neue', Arial" },
  rounded: { label: 'Rounded', family: "ui-rounded, 'SF Pro Rounded', system-ui" },
  serif: { label: 'Serif', family: "ui-serif, Georgia, 'Times New Roman', serif" },
  mono: { label: 'Mono', family: "ui-monospace, Menlo, 'Courier New', monospace" },
  // Display fonts, self-hosted.
  bebas: { label: 'Bebas', family: "'Bebas Neue'" },
  anton: { label: 'Anton', family: "'Anton'" },
  bungee: { label: 'Bungee', family: "'Bungee'" },
  monoton: { label: 'Monoton', family: "'Monoton'", lined: true },
  pacifico: { label: 'Pacifico', family: "'Pacifico'" },
  pressstart: { label: 'Arcade', family: "'Press Start 2P'" },
};

export const LIMITS = {
  dotRows: [12, 96],
  size: [10, 100],
  letterSpacing: [-0.05, 0.5],
  angle: [0, 360],
  borderWidth: [2, 40],
  speed: [1, 20],
} as const satisfies Record<string, readonly [number, number]>;

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  text: 'WE LOVE YOU 💜',
  font: 'bebas',
  render: 'smooth',
  dotRows: 40,
  unlit: 'faint',
  size: 60,
  fit: false,
  color: '#ffffff',
  rainbow: false,
  bold: false,
  italic: false,
  caps: false,
  outline: false,
  glow: true,
  letterSpacing: 0.02,
  background: { kind: 'solid', color: '#000000', color2: '#2b0040', angle: 135 },
  border: { style: 'none', color: '#ffd43b', width: 12 },
  scroll: 'left',
  speed: 8,
  blink: 'off',
};

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;
const num = (v: unknown, [min, max]: readonly [number, number], fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const hex = (v: unknown, fallback: string): string =>
  typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;

/** Turns anything (saved JSON, partial objects) into valid Settings, field by field. */
export function sanitize(raw: unknown): Settings {
  const r = isRec(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;
  const bg = isRec(r.background) ? r.background : {};
  const border = isRec(r.border) ? r.border : {};
  return {
    version: 1,
    text: typeof r.text === 'string' ? r.text.slice(0, MAX_TEXT) : d.text,
    font: oneOf(r.font, Object.keys(FONTS) as FontId[], d.font),
    render: oneOf(r.render, ['smooth', 'led', 'pixel'], d.render),
    dotRows: Math.round(num(r.dotRows, LIMITS.dotRows, d.dotRows)),
    unlit: oneOf(r.unlit, ['off', 'faint'], d.unlit),
    size: num(r.size, LIMITS.size, d.size),
    fit: bool(r.fit, d.fit),
    color: hex(r.color, d.color),
    rainbow: bool(r.rainbow, d.rainbow),
    bold: bool(r.bold, d.bold),
    italic: bool(r.italic, d.italic),
    caps: bool(r.caps, d.caps),
    outline: bool(r.outline, d.outline),
    glow: bool(r.glow, d.glow),
    letterSpacing: num(r.letterSpacing, LIMITS.letterSpacing, d.letterSpacing),
    background: {
      kind: oneOf(bg.kind, ['solid', 'gradient'], d.background.kind),
      color: hex(bg.color, d.background.color),
      color2: hex(bg.color2, d.background.color2),
      angle: num(bg.angle, LIMITS.angle, d.background.angle),
    },
    border: {
      style: oneOf(border.style, ['none', 'solid', 'neon', 'bulbs'], d.border.style),
      color: hex(border.color, d.border.color),
      width: num(border.width, LIMITS.borderWidth, d.border.width),
    },
    scroll: oneOf(r.scroll, ['off', 'left', 'right', 'up', 'down'], d.scroll),
    speed: num(r.speed, LIMITS.speed, d.speed),
    blink: oneOf(r.blink, ['off', 'slow', 'fast'], d.blink),
  };
}
