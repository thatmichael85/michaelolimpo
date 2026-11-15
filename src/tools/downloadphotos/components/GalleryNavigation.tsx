import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { monthLabel } from '../api';

const motion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/** Timeline covers loaded sections; ordinary pagination keeps extending its range. */
export function GalleryNavigation({ months }: { months: string[] }) {
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const update = () => {
      setShowTop(window.scrollY > 400);
      const sections = [...document.querySelectorAll<HTMLElement>('.cf-month[data-month-key]')];
      const current = sections.filter(s => s.getBoundingClientRect().top <= 140).at(-1) ?? sections[0];
      const index = months.indexOf(current?.dataset.monthKey ?? '');
      if (index >= 0) setActive(index);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [months]);

  const navigate = (index: number, drag = false) => {
    const i = Math.max(0, Math.min(months.length - 1, index));
    setActive(i);
    document.querySelector<HTMLElement>(`.cf-month[data-month-key="${months[i]}"]`)
      ?.scrollIntoView({ block: 'start', behavior: drag ? 'auto' : motion() });
  };
  const pointerIndex = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (e.clientY - box.top) / box.height)) * (months.length - 1));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const i = pointerIndex(e);
    setHover(i);
    if (dragging.current) navigate(i, true);
  };
  const keyboard = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.key === 'Home' ? 0 : e.key === 'End' ? months.length - 1
      : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? active + 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? active - 1 : null;
    if (target != null) { e.preventDefault(); navigate(target); }
  };
  const selected = Math.min(hover ?? active, months.length - 1);
  const position = (i: number) => `${i / Math.max(1, months.length - 1) * 100}%`;

  return <>
    {months.length > 1 && <div className="cf-date-timeline" role="slider" tabIndex={0}
      aria-label="Photo date timeline" aria-orientation="vertical" aria-valuemin={0}
      aria-valuemax={months.length - 1} aria-valuenow={Math.min(active, months.length - 1)}
      aria-valuetext={monthLabel(months[Math.min(active, months.length - 1)])}
      title="Navigate loaded photos by date" onKeyDown={keyboard}
      onPointerDown={e => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        const i = pointerIndex(e); setHover(i); navigate(i, true);
      }}
      onPointerMove={move}
      onPointerUp={() => { dragging.current = false; setHover(null); }}
      onPointerCancel={() => { dragging.current = false; setHover(null); }}
      onPointerLeave={() => { if (!dragging.current) setHover(null); }}>
      {months.map((month, i) => <span key={month} className="cf-date-tick" style={{ top: position(i) }} aria-hidden="true">
        {(i === 0 || month.slice(0, 4) !== months[i - 1].slice(0, 4)) && <span className="cf-date-year">{month.slice(0, 4)}</span>}
      </span>)}
      <span className="cf-date-handle" style={{ top: position(Math.min(active, months.length - 1)) }} aria-hidden="true" />
      {hover != null && <span className="cf-date-tooltip" style={{ top: position(selected) }} aria-hidden="true">{monthLabel(months[selected])}</span>}
    </div>}
    {showTop && <button type="button" className="cf-scroll-top" aria-label="Scroll to top"
      title="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: motion() })}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m6 12 6-6 6 6M12 6v14M5 3h14" />
      </svg>
    </button>}
  </>;
}
