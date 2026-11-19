import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, type Settings } from '../settings';
import { Display } from './Display';

type Callback = (entries: { contentRect: { width: number; height: number } }[]) => void;
let observers: Callback[] = [];
let size = { width: 1180, height: 820 };

beforeEach(() => {
  observers = [];
  size = { width: 1180, height: 820 };
  vi.stubGlobal(
    'ResizeObserver',
    class {
      cb: Callback;
      constructor(cb: Callback) {
        this.cb = cb;
      }
      observe() {
        observers.push(this.cb);
        this.cb([{ contentRect: size }]);
      }
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const show = (patch: Partial<Settings> = {}) => render(<Display settings={{ ...DEFAULT_SETTINGS, ...patch }} />);
const textEl = () => document.querySelector<HTMLElement>('.mq-text')!;

describe('Display (smooth)', () => {
  it('colours letters but leaves emoji untouched', () => {
    show({ text: 'HI 💜', color: '#ff0000', glow: true });
    const letters = document.querySelector<HTMLElement>('.mq-letters')!;
    const emoji = document.querySelector<HTMLElement>('.mq-emoji')!;
    expect(letters).toHaveTextContent('HI');
    expect(letters.style.color).toBe('rgb(255, 0, 0)');
    expect(letters.style.textShadow).not.toBe('');
    expect(emoji).toHaveTextContent('💜');
    expect(emoji.style.color).toBe('');
    expect(emoji.style.textShadow).toBe('');
  });

  it('has no glow when glow is off', () => {
    show({ text: 'HI', glow: false });
    expect(document.querySelector<HTMLElement>('.mq-letters')!.style.textShadow).toBe('');
  });

  it('paints a gradient background', () => {
    show({ background: { kind: 'gradient', color: '#000000', color2: '#ff00ff', angle: 90 } });
    expect(screen.getByTestId('mq-display').style.background).toContain('linear-gradient');
  });

  it('draws bulbs, neon or no border', () => {
    const { unmount } = show({ border: { style: 'bulbs', color: '#ffd43b', width: 12 } });
    expect(document.querySelectorAll('circle').length).toBeGreaterThan(10);
    unmount();
    const neon = show({ border: { style: 'neon', color: '#22e4ff', width: 12 } });
    expect(document.querySelector<HTMLElement>('.mq-frame')!.style.boxShadow).not.toBe('');
    neon.unmount();
    show({ border: { style: 'none', color: '#22e4ff', width: 12 } });
    expect(document.querySelector('.mq-frame')).toBeNull();
    expect(document.querySelector('circle')).toBeNull();
  });

  it('blinks at the capped fast rate', () => {
    show({ blink: 'fast' });
    const blink = document.querySelector<HTMLElement>('.mq-blink')!;
    expect(blink.style.getPropertyValue('--mq-blink-ms')).toBe('400ms');
  });

  it('scrolls horizontally with a duration, and not at all when scroll is off', () => {
    const { unmount } = show({ scroll: 'left' });
    const track = document.querySelector<HTMLElement>('.mq-track')!;
    expect(track.style.animationName).toBe('mq-scroll-x');
    expect(parseFloat(track.style.animationDuration)).toBeGreaterThan(0);
    unmount();
    show({ scroll: 'off' });
    expect(document.querySelector<HTMLElement>('.mq-track')!.style.animationName).toBe('');
  });

  it('re-lays out when the screen rotates', () => {
    show({ size: 60, fit: false });
    const before = textEl().style.fontSize;
    act(() => observers.forEach((cb) => cb([{ contentRect: { width: 820, height: 1180 } }])));
    expect(textEl().style.fontSize).not.toBe(before);
  });

  it('renders nothing for empty text without crashing', () => {
    show({ text: '' });
    expect(document.querySelector('.mq-letters')).toBeNull();
  });

  it('measures vertically scrolling text wrapped to the screen width', () => {
    show({ text: 'WE LOVE YOU', scroll: 'up', size: 60, fit: false });
    const measure = document.querySelector<HTMLElement>('.mq-measure')!;
    // 60% of 820 = 492px font; the 1180px box is 1180 * 100 / 492 wide at the 100px reference size.
    expect(parseFloat(measure.style.width)).toBeCloseTo((1180 * 100) / 492, 1);
  });

  it('shrinks a still sign that would wrap taller than the screen', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('mq-measure') ? 330 : 0;
    });
    show({ text: 'WE LOVE YOU', scroll: 'off', size: 60, fit: false });
    expect(parseFloat(textEl().style.fontSize)).toBeLessThan(492);
  });

  it('keeps the LED glow layer mounted so toggling Glow shows immediately', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    show({ text: 'HI', render: 'led', glow: false });
    expect(document.querySelector('canvas.mq-led-glow')).not.toBeNull();
    expect(document.querySelector('canvas.mq-led-glow')).toHaveClass('mq-led-glow--off');
  });

  it('renders LED mode as a round-dot canvas instead of text', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    show({ text: 'HI', render: 'led' });
    expect(document.querySelector('canvas.mq-led.mq-led--round')).not.toBeNull();
    expect(document.querySelector('.mq-letters')).toBeNull();
  });

  it('renders PIXEL mode with square dots', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    show({ text: 'HI', render: 'pixel' });
    expect(document.querySelector('canvas.mq-led.mq-led--square')).not.toBeNull();
  });

  it('gives each rainbow letter its own staggered colour cycle', () => {
    show({ text: 'AB', rainbow: true });
    const spans = document.querySelectorAll<HTMLElement>('.mq-rainbow');
    expect(spans).toHaveLength(2);
    expect(spans[0].style.animationDelay).not.toBe(spans[1].style.animationDelay);
  });
});
