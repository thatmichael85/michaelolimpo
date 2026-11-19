import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { balanceLines, blinkPeriodMs, fitScale, scrollDurationMs } from '../layout';
import { segment } from '../segments';
import { FONTS, type Settings } from '../settings';
import { fontCss, textMeasurer } from '../style';
import type { Size } from '../useElementSize';

/** Text is measured at this font size, then scaled. */
const REF = 100;
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Bumps whenever a web font finishes loading, so text gets re-measured. */
function useFontsLoaded(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.addEventListener) return;
    const bump = () => setN((v) => v + 1);
    fonts.addEventListener('loadingdone', bump);
    return () => fonts.removeEventListener('loadingdone', bump);
  }, []);
  return n;
}

function letterCss(s: Settings): CSSProperties {
  const glowColor = s.rainbow ? 'currentColor' : s.color;
  // Striped fonts (Monoton) are already outlines: a stroke clogs the stripes and a wide glow blurs them.
  const lined = FONTS[s.font].lined === true;
  const outline = s.outline && !lined;
  const glow = lined
    ? `0 0 0.02em ${glowColor}, 0 0 0.08em ${glowColor}`
    : `0 0 0.06em ${glowColor}, 0 0 0.2em ${glowColor}, 0 0 0.45em ${glowColor}`;
  return {
    color: s.rainbow ? undefined : outline ? 'transparent' : s.color,
    WebkitTextStroke: outline ? `0.035em ${s.rainbow ? 'currentColor' : s.color}` : undefined,
    textShadow: s.glow ? glow : undefined,
  };
}

function Content({ s, singleLine }: { s: Settings; singleLine: boolean }) {
  const letters = letterCss(s);
  let index = 0;
  return segment(s.text, { caps: s.caps, singleLine }).map((seg, i) => {
    if (seg.emoji) return <span key={i} className="mq-emoji">{seg.text}</span>;
    if (!s.rainbow) return <span key={i} className="mq-letters" style={letters}>{seg.text}</span>;
    return (
      <span key={i} className="mq-letters">
        {Array.from(graphemes.segment(seg.text), ({ segment: g }) => (
          <span key={index} className="mq-rainbow" style={{ ...letters, animationDelay: `${-((index++ * 0.15) % 3)}s` }}>
            {g}
          </span>
        ))}
      </span>
    );
  });
}

export function SmoothText({ settings: s, box }: { settings: Settings; box: Size }) {
  const horizontal = s.scroll === 'left' || s.scroll === 'right';
  const vertical = s.scroll === 'up' || s.scroll === 'down';
  const fontsLoaded = useFontsLoaded();
  const upper = s.caps ? s.text.toUpperCase() : s.text;
  // A still, fit-to-screen sign wraps onto balanced lines so it stays as big as possible.
  const balance = s.scroll === 'off' && s.fit;
  const balanced = useMemo(() => {
    if (!balance) return null;
    const widthOf = textMeasurer(s, REF);
    return widthOf ? balanceLines(upper, widthOf, REF * 1.1, box).join('\n') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- font fields listed individually
  }, [balance, upper, s.font, s.bold, s.italic, s.letterSpacing, box.w, box.h, fontsLoaded]);
  const shown = balanced ?? upper;
  const measureText = horizontal ? shown.replace(/\r?\n/g, ' ') : shown;
  const lines = horizontal ? 1 : Math.max(1, shown.split('\n').length);

  // Font size from the Text size setting; wrapping text is measured at the width it will wrap to.
  const sizedFont = ((s.size / 100) * box.h) / lines;
  const wraps = !horizontal && !s.fit;
  const measureWidth = wraps ? `${(box.w * REF) / sizedFont}px` : undefined;

  const measureRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<Size>({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const next = { w: el.offsetWidth, h: el.offsetHeight };
    setNatural((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
  }, [measureText, measureWidth, s.font, s.bold, s.italic, s.letterSpacing, fontsLoaded]);

  let fontSize = s.fit ? REF * fitScale(natural, box, horizontal ? 'height' : 'both') : sizedFont;
  if (wraps && !vertical) {
    // A still sign never runs off the top and bottom: shrink until the wrapped text fits.
    const wrappedH = (natural.h * sizedFont) / REF;
    if (wrappedH > box.h * 0.95) fontSize = (sizedFont * box.h * 0.95) / wrappedH;
  }
  const k = fontSize / REF;
  const text = { w: natural.w * k, h: natural.h * k };

  const trackStyle: CSSProperties & Record<string, string | number> = {};
  if (horizontal || vertical) {
    const [span, len] = horizontal ? [box.w, text.w] : [box.h, text.h];
    const forward = s.scroll === 'left' || s.scroll === 'up';
    trackStyle['--mq-from'] = `${forward ? span : -len}px`;
    trackStyle['--mq-to'] = `${forward ? -len : span}px`;
    trackStyle.animationName = horizontal ? 'mq-scroll-x' : 'mq-scroll-y';
    trackStyle.animationDuration = `${scrollDurationMs(span + len, box.h, s.speed)}ms`;
  }

  const blink = blinkPeriodMs(s.blink);
  const textStyle: CSSProperties & Record<string, string | number> = { ...fontCss(s), fontSize };
  if (blink) textStyle['--mq-blink-ms'] = `${blink}ms`;

  return (
    <>
      <div className={`mq-track mq-track--${horizontal ? 'x' : vertical ? 'y' : 'static'}`} style={trackStyle}>
        <div className={`mq-text${blink ? ' mq-blink' : ''}${horizontal ? ' mq-text--nowrap' : ''}`} style={textStyle}>
          <Content s={balanced ? { ...s, text: balanced } : s} singleLine={horizontal} />
        </div>
      </div>
      <div ref={measureRef} className={`mq-text mq-measure${horizontal ? ' mq-text--nowrap' : ''}`} style={{ ...fontCss(s), fontSize: REF, width: measureWidth }} aria-hidden="true">
        {measureText}
      </div>
    </>
  );
}
