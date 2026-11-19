import { FONTS, LIMITS, type FontId, type Settings } from '../settings';
import type { SettingsApi } from '../useSettings';
import { ColorField, Segmented, Slider, Toggle } from './controls';

/** Pixel size slider runs chunky → fine, i.e. inverse of the number of dot rows. */
const [MIN_ROWS, MAX_ROWS] = LIMITS.dotRows;
const pixelSize = (rows: number) => MIN_ROWS + MAX_ROWS - rows;

export function TextPanel({ settings: s, update }: Pick<SettingsApi, 'settings' | 'update'>) {
  const dots = s.render !== 'smooth';
  return (
    <section className="mq-panel" aria-label="Text">
      <h2 className="mq-panel__title">Text</h2>
      <Segmented<FontId>
        label="Font"
        value={s.font}
        onChange={(font) => update({ font })}
        options={(Object.keys(FONTS) as FontId[]).map((id) => ({
          value: id,
          label: FONTS[id].label,
          style: { fontFamily: FONTS[id].family },
        }))}
      />
      <Segmented<Settings['render']>
        label="Render"
        value={s.render}
        onChange={(render) => update({ render })}
        options={[
          { value: 'smooth', label: 'Smooth' },
          { value: 'led', label: 'LED' },
          { value: 'pixel', label: 'Pixel' },
        ]}
      />
      {dots && (
        <>
          <Slider label="Pixel size" min={MIN_ROWS} max={MAX_ROWS} value={pixelSize(s.dotRows)} onChange={(v) => update({ dotRows: pixelSize(v) })} />
          <Segmented<Settings['unlit']>
            label="Unlit dots"
            value={s.unlit}
            onChange={(unlit) => update({ unlit })}
            options={[
              { value: 'off', label: 'Hidden' },
              { value: 'faint', label: 'Faint' },
            ]}
          />
        </>
      )}
      <Slider label="Size" min={LIMITS.size[0]} max={LIMITS.size[1]} value={s.size} disabled={s.fit} onChange={(size) => update({ size })} />
      <div className="mq-toggles">
        <Toggle label="Fit to screen" checked={s.fit} onChange={(fit) => update({ fit })} />
      </div>
      <ColorField label="Colour" value={s.color} onChange={(color) => update({ color, rainbow: false })} />
      <div className="mq-toggles">
        <Toggle label="🌈 Rainbow" checked={s.rainbow} onChange={(rainbow) => update({ rainbow })} />
        <Toggle label="Bold" checked={s.bold} onChange={(bold) => update({ bold })} />
        <Toggle label="Italic" checked={s.italic} onChange={(italic) => update({ italic })} />
        <Toggle label="CAPS" checked={s.caps} onChange={(caps) => update({ caps })} />
        <Toggle label="Outline" checked={s.outline && !dots} disabled={dots} onChange={(outline) => update({ outline })} />
        <Toggle label="Glow" checked={s.glow} onChange={(glow) => update({ glow })} />
      </div>
      <Slider
        label="Letter spacing"
        min={LIMITS.letterSpacing[0]}
        max={LIMITS.letterSpacing[1]}
        step={0.01}
        value={s.letterSpacing}
        onChange={(letterSpacing) => update({ letterSpacing })}
      />
    </section>
  );
}
