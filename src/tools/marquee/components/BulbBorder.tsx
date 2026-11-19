import type { CSSProperties } from 'react';
import { BULB_STEP_MS, bulbPositions } from '../layout';

/** A ring of bulbs around the edge; odd and even bulbs alternate like a theatre chase. */
export function BulbBorder({ w, h, width, color }: { w: number; h: number; width: number; color: string }) {
  const bulbs = bulbPositions(w, h, width * 2.2, width / 2);
  const style = { '--mq-bulb-ms': `${BULB_STEP_MS * 2}ms`, color } as CSSProperties;
  return (
    <svg className="mq-bulbs" viewBox={`0 0 ${w} ${h}`} style={style} aria-hidden="true">
      {bulbs.map(({ x, y }, i) => (
        <circle key={i} className={`mq-bulb ${i % 2 ? 'mq-bulb--b' : 'mq-bulb--a'}`} cx={x} cy={y} r={width * 0.38} />
      ))}
    </svg>
  );
}
