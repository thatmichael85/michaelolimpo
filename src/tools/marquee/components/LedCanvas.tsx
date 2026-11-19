import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { blinkPeriodMs, scrollRate } from '../layout';
import { blendCells, stripLength, windowCells, type CellGrid } from '../led';
import { rasterizeText } from '../rasterize';
import type { Settings } from '../settings';

const UNLIT_ALPHA = 0.14 * 255;

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** LED (round) / PIXEL (square) board: a cols×rows canvas scaled up, with dots cut by a CSS mask. */
export function LedCanvas({ settings: s, w, h }: { settings: Settings; w: number; h: number }) {
  const rows = s.dotRows;
  const pitch = h / rows;
  const cols = Math.max(1, Math.floor(w / pitch));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  const [strip, setStrip] = useState<CellGrid | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(0);

  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.addEventListener) return;
    const bump = () => setFontsLoaded((v) => v + 1);
    fonts.addEventListener('loadingdone', bump);
    return () => fonts.removeEventListener('loadingdone', bump);
  }, []);

  // Re-rasterise only when something that changes the dot pattern changes.
  const { text, font, bold, italic, caps, letterSpacing, size, fit, color, rainbow, scroll } = s;
  useEffect(() => {
    let live = true;
    rasterizeText(s, { cols, rows })
      .then((grid) => live && setStrip(grid))
      .catch(() => live && setStrip(null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `s` is listed field by field
  }, [text, font, bold, italic, caps, letterSpacing, size, fit, color, rainbow, scroll, cols, rows, fontsLoaded]);

  const { speed, blink, unlit } = s;
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const glow = glowRef.current?.getContext('2d') ?? null;
    if (!ctx || !strip) return;
    const horizontal = scroll === 'left' || scroll === 'right';
    const vertical = scroll === 'up' || scroll === 'down';
    const axis = vertical ? 'y' : 'x';
    const { gap } = stripLength(vertical ? strip.rows : strip.cols, vertical ? rows : cols);
    const cellsPerSec = scrollRate(speed) * rows;
    const blinkMs = blinkPeriodMs(blink);
    const [ur, ug, ub] = rainbow ? [255, 255, 255] : hexRgb(color);
    const lit = ctx.createImageData(cols, rows);
    const frame = ctx.createImageData(cols, rows);
    const start = performance.now();
    let lastKey = '';
    let raf = 0;

    const unlitAlpha = unlit === 'faint' ? UNLIT_ALPHA : 0;
    const view = { cols, rows };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const elapsed = now - start;
      const moved = horizontal || vertical ? (elapsed * cellsPerSec) / 1000 : 0;
      const along = vertical ? rows : cols;
      const len = vertical ? strip.rows : strip.cols;
      const offset = !horizontal && !vertical
        ? 0
        : scroll === 'left' || scroll === 'up' ? moved - along : len - moved;
      const off = blinkMs !== null && Math.floor(elapsed / (blinkMs / 2)) % 2 === 1;
      const key = `${Math.round(offset * 32)}:${off}`;
      if (key === lastKey) return; // only redraw when the board visibly changes
      lastKey = key;

      // Between two dot positions, cross-fade so the text glides across the fixed dots.
      const whole = Math.floor(offset);
      const frac = offset - whole;
      const here = windowCells(strip, view, whole, axis, gap);
      const cells = frac > 0 ? blendCells(here, windowCells(strip, view, whole + 1, axis, gap), frac) : here;

      for (let i = 0; i < cells.data.length; i += 4) {
        const a = off ? 0 : cells.data[i + 3] / 255;
        const [r, g, b] = [cells.data[i], cells.data[i + 1], cells.data[i + 2]];
        lit.data[i] = r;
        lit.data[i + 1] = g;
        lit.data[i + 2] = b;
        lit.data[i + 3] = a * 255;
        // Lit colour over the faint unlit dot.
        const under = unlitAlpha * (1 - a);
        const total = under + 255 * a;
        frame.data[i + 3] = total;
        if (total === 0) continue;
        frame.data[i] = (ur * under + r * 255 * a) / total;
        frame.data[i + 1] = (ug * under + g * 255 * a) / total;
        frame.data[i + 2] = (ub * under + b * 255 * a) / total;
      }
      ctx.putImageData(frame, 0, 0);
      glow?.putImageData(lit, 0, 0);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [strip, cols, rows, scroll, speed, blink, unlit, color, rainbow]);

  const style = {
    width: cols * pitch,
    height: rows * pitch,
    left: (w - cols * pitch) / 2,
    top: (h - rows * pitch) / 2,
    '--mq-pitch': `${pitch}px`,
  } as CSSProperties;
  const shape = s.render === 'pixel' ? 'square' : 'round';

  return (
    <>
      {/* Always mounted so the draw loop holds its context; Glow just shows or hides it. */}
      <canvas ref={glowRef} className={`mq-led-glow${s.glow ? '' : ' mq-led-glow--off'}`} width={cols} height={rows} style={style} aria-hidden="true" />
      <canvas ref={canvasRef} className={`mq-led mq-led--${shape}`} width={cols} height={rows} style={style} aria-hidden="true" />
    </>
  );
}
