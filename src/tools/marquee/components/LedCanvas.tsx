import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { blinkPeriodMs, scrollRate } from '../layout';
import { stripLength, windowCells, type CellGrid } from '../led';
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

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const elapsed = now - start;
      const step = horizontal || vertical ? Math.floor((elapsed * cellsPerSec) / 1000) : 0;
      const along = vertical ? rows : cols;
      const len = vertical ? strip.rows : strip.cols;
      const offset = !horizontal && !vertical
        ? 0
        : scroll === 'left' || scroll === 'up' ? step - along : len - step;
      const off = blinkMs !== null && Math.floor(elapsed / (blinkMs / 2)) % 2 === 1;
      const key = `${offset}:${off}`;
      if (key === lastKey) return; // only redraw when the board actually changes
      lastKey = key;

      const view = windowCells(strip, { cols, rows }, offset, axis, gap);
      for (let i = 0; i < view.data.length; i += 4) {
        const on = !off && view.data[i + 3] > 0;
        lit.data[i + 3] = on ? 255 : 0;
        if (on) {
          lit.data[i] = frame.data[i] = view.data[i];
          lit.data[i + 1] = frame.data[i + 1] = view.data[i + 1];
          lit.data[i + 2] = frame.data[i + 2] = view.data[i + 2];
          frame.data[i + 3] = 255;
        } else {
          frame.data[i] = ur;
          frame.data[i + 1] = ug;
          frame.data[i + 2] = ub;
          frame.data[i + 3] = unlit === 'faint' ? UNLIT_ALPHA : 0;
        }
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
