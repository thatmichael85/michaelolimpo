import { useRef } from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSlideOnChange } from './useSlideOnChange';

function Box({ layoutKey }: { layoutKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useSlideOnChange(ref, layoutKey);
  return <div ref={ref} data-testid="box" />;
}

describe('useSlideOnChange', () => {
  let lefts: number[];
  const animate = vi.fn();

  beforeEach(() => {
    lefts = [340, 100];
    animate.mockReset();
    HTMLElement.prototype.animate = animate as unknown as HTMLElement['animate'];
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ left: lefts.shift() ?? 100, top: 0 }) as DOMRect,
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error cleanup of the test stub
    delete window.matchMedia;
  });

  it('slides from the old position instead of jumping when the layout key changes', () => {
    const { rerender } = render(<Box layoutKey="single" />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<Box layoutKey="with-chat" />);
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translate(240px, 0px)' }, { transform: 'none' }],
      expect.objectContaining({ duration: 250, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }),
    );
  });

  it('does not animate when the visitor prefers reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const { rerender } = render(<Box layoutKey="single" />);
    rerender(<Box layoutKey="with-chat" />);
    expect(animate).not.toHaveBeenCalled();
  });
});
