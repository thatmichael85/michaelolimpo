import { blinkTiming } from '../layout';
import { LIMITS, type Settings } from '../settings';
import type { SettingsApi } from '../useSettings';
import { ColorField, Segmented, Slider } from './controls';

/** 800 → "0.8", 1000 → "1", 1250 → "1.25". */
const seconds = (ms: number) => String(+(ms / 1000).toFixed(2));

const DARKS = ['#000000', '#120a00', '#0a0f2b', '#2b0040', '#002b1a', '#3a0000', '#1f1f1f', '#ffffff'];

export function DisplayPanel({ settings: s, update }: Pick<SettingsApi, 'settings' | 'update'>) {
  const bg = s.background;
  const border = s.border;
  const blink = blinkTiming(s);
  return (
    <section className="mq-panel" aria-label="Display">
      <h2 className="mq-panel__title">Display</h2>
      <Segmented<Settings['background']['kind']>
        label="Background"
        value={bg.kind}
        onChange={(kind) => update({ background: { ...bg, kind } })}
        options={[
          { value: 'solid', label: 'Solid' },
          { value: 'gradient', label: 'Gradient' },
        ]}
      />
      <ColorField label="Background colour" swatches={DARKS} value={bg.color} onChange={(color) => update({ background: { ...bg, color } })} />
      {bg.kind === 'gradient' && (
        <>
          <ColorField label="Second colour" swatches={DARKS} value={bg.color2} onChange={(color2) => update({ background: { ...bg, color2 } })} />
          <Slider label="Angle" min={LIMITS.angle[0]} max={LIMITS.angle[1]} value={bg.angle} onChange={(angle) => update({ background: { ...bg, angle } })} />
        </>
      )}
      <Segmented<Settings['border']['style']>
        label="Border"
        value={border.style}
        onChange={(style) => update({ border: { ...border, style } })}
        options={[
          { value: 'none', label: 'None' },
          { value: 'solid', label: 'Solid' },
          { value: 'neon', label: 'Neon' },
          { value: 'bulbs', label: 'Bulbs' },
        ]}
      />
      {border.style !== 'none' && (
        <>
          <ColorField label="Border colour" value={border.color} onChange={(color) => update({ border: { ...border, color } })} />
          <Slider
            label="Border thickness"
            min={LIMITS.borderWidth[0]}
            max={LIMITS.borderWidth[1]}
            value={border.width}
            onChange={(width) => update({ border: { ...border, width } })}
          />
        </>
      )}
      <Segmented<Settings['scroll']>
        label="Scroll"
        value={s.scroll}
        onChange={(scroll) => update({ scroll })}
        options={[
          { value: 'off', label: 'Off' },
          { value: 'left', label: '←', name: 'Left' },
          { value: 'right', label: '→', name: 'Right' },
          { value: 'up', label: '↑', name: 'Up' },
          { value: 'down', label: '↓', name: 'Down' },
        ]}
      />
      <Slider
        label="Speed"
        min={LIMITS.speed[0]}
        max={LIMITS.speed[1]}
        value={s.speed}
        disabled={s.scroll === 'off'}
        tickLabels={[1, 5, 10, 15, 20]}
        onChange={(speed) => update({ speed })}
      />
      <Segmented<Settings['blink']>
        label="Blink"
        value={s.blink}
        onChange={(blink) => update({ blink })}
        options={[
          { value: 'off', label: 'Steady' },
          { value: 'on', label: 'Blink' },
        ]}
      />
      {blink && (
        <>
          <Slider
            label="Cycle length"
            min={LIMITS.blinkMs[0]}
            max={LIMITS.blinkMs[1]}
            step={100}
            value={s.blinkMs}
            tickLabels={[400, 1000, 2000, 3000]}
            formatTick={(ms) => `${seconds(ms)}s`}
            onChange={(blinkMs) => update({ blinkMs })}
          />
          <Slider
            label="Visible"
            min={LIMITS.blinkDuty[0]}
            max={LIMITS.blinkDuty[1]}
            step={10}
            value={s.blinkDuty}
            tickLabels={[10, 50, 90]}
            formatTick={(pct) => `${pct}%`}
            onChange={(blinkDuty) => update({ blinkDuty })}
          />
          <p className="mq-help">On {seconds(blink.onMs)} s · Off {seconds(blink.offMs)} s</p>
        </>
      )}
    </section>
  );
}
