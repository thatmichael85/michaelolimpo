import { useId, type CSSProperties, type ReactNode } from 'react';

export interface Option<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is a symbol. */
  name?: string;
  style?: CSSProperties;
}

export function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const group = useId();
  return (
    <fieldset className="mq-field" role="radiogroup" aria-label={props.label} disabled={props.disabled}>
      <legend className="mq-label">{props.label}</legend>
      <div className="mq-seg">
        {props.options.map((o) => (
          <label key={o.value} className="mq-seg__opt" style={o.style}>
            <input
              type="radio"
              name={group}
              value={o.value}
              checked={props.value === o.value}
              onChange={() => props.onChange(o.value)}
              aria-label={o.name}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  /** Draws a tick at every step, numbering these values. */
  tickLabels?: number[];
}) {
  const id = useId();
  const step = props.step ?? 1;
  const ticks = props.tickLabels
    ? Array.from({ length: Math.round((props.max - props.min) / step) + 1 }, (_, i) => props.min + i * step)
    : null;
  const pct = (v: number) => `${((v - props.min) / (props.max - props.min)) * 100}%`;
  const input = (
    <input
      id={id}
      className="mq-range"
      type="range"
      min={props.min}
      max={props.max}
      step={step}
      value={props.value}
      disabled={props.disabled}
      list={ticks ? `${id}-ticks` : undefined}
      onChange={(e) => props.onChange(Number(e.target.value))}
    />
  );
  return (
    <div className="mq-field mq-field--row">
      <label className="mq-label" htmlFor={id}>{props.label}</label>
      {ticks ? (
        <div className="mq-ticked">
          {input}
          <datalist id={`${id}-ticks`}>
            {ticks.map((t) => <option key={t} value={t} />)}
          </datalist>
          <div className="mq-ticks" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className={`mq-tick${props.tickLabels!.includes(t) ? ' mq-tick--major' : ''}`} style={{ left: pct(t) }}>
                {props.tickLabels!.includes(t) && <span className="mq-tick__label">{t}</span>}
              </span>
            ))}
          </div>
        </div>
      ) : (
        input
      )}
    </div>
  );
}

export function Toggle(props: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`mq-toggle${props.disabled ? ' mq-toggle--disabled' : ''}`}>
      <input type="checkbox" checked={props.checked} disabled={props.disabled} onChange={(e) => props.onChange(e.target.checked)} />
      <span>{props.label}</span>
    </label>
  );
}

const SWATCHES = ['#ffffff', '#ff3b3b', '#ffb000', '#fff200', '#3bff6a', '#22e4ff', '#ff4fd8', '#9b6bff'];

export function ColorField(props: { label: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  const id = useId();
  return (
    <div className="mq-field">
      <span className="mq-label">{props.label}</span>
      <div className="mq-swatches">
        {(props.swatches ?? SWATCHES).map((c) => (
          <button
            key={c}
            type="button"
            className={`mq-swatch${props.value === c ? ' mq-swatch--on' : ''}`}
            style={{ background: c }}
            aria-label={`${props.label} ${c}`}
            aria-pressed={props.value === c}
            onClick={() => props.onChange(c)}
          />
        ))}
        <input id={id} className="mq-color" type="color" value={props.value} aria-label={`${props.label} custom`} onChange={(e) => props.onChange(e.target.value)} />
      </div>
    </div>
  );
}
