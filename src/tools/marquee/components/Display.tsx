import type { CSSProperties } from 'react';
import type { Settings } from '../settings';
import { useElementSize } from '../useElementSize';
import { BulbBorder } from './BulbBorder';
import { LedCanvas } from './LedCanvas';
import { SmoothText } from './SmoothText';

/** Border widths in settings are px at full iPad landscape height. */
const FULL_HEIGHT = 820;

function backgroundCss({ kind, color, color2, angle }: Settings['background']): string {
  return kind === 'gradient' ? `linear-gradient(${angle}deg, ${color}, ${color2})` : color;
}

function frameShadow({ style, color }: Settings['border'], bw: number): string | undefined {
  if (style === 'solid') return `inset 0 0 0 ${bw}px ${color}`;
  if (style === 'neon') return `inset 0 0 0 ${bw * 0.3}px #ffffffcc, inset 0 0 0 ${bw * 0.6}px ${color}, inset 0 0 ${bw * 2}px ${color}`;
  return undefined;
}

/** The sign itself, filling its parent. Everything scales with the measured height. */
export function Display({ settings }: { settings: Settings }) {
  const [ref, { w, h }] = useElementSize<HTMLDivElement>();
  const { border } = settings;
  const bw = border.style === 'none' ? 0 : border.width * (h / FULL_HEIGHT);
  const box = { w: Math.max(0, w - bw * 2), h: Math.max(0, h - bw * 2) };
  const stageStyle: CSSProperties = { inset: bw };

  return (
    <div ref={ref} data-testid="mq-display" className="mq-display" style={{ background: backgroundCss(settings.background) }}>
      <div className="mq-stage" style={stageStyle}>
        {box.w > 0 && box.h > 0 && (settings.render === 'smooth'
          ? <SmoothText settings={settings} box={box} />
          : <LedCanvas settings={settings} w={box.w} h={box.h} />)}
      </div>
      {(border.style === 'solid' || border.style === 'neon') && (
        <div className="mq-frame" style={{ boxShadow: frameShadow(border, bw) }} />
      )}
      {border.style === 'bulbs' && w > 0 && <BulbBorder w={w} h={h} width={bw} color={border.color} />}
    </div>
  );
}
