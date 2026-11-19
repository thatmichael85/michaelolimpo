import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLongPress } from './useLongPress';
import { useWakeLock } from './useWakeLock';

function Pad({ onLong }: { onLong: () => void }) {
  return <div data-testid="pad" {...useLongPress(onLong)} />;
}

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires after holding for one second, not before', () => {
    const onLong = vi.fn();
    render(<Pad onLong={onLong} />);
    fireEvent.pointerDown(screen.getByTestId('pad'), { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(900));
    expect(onLong).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    expect(onLong).toHaveBeenCalledOnce();
  });

  it('does not fire when released early (a bump or tap)', () => {
    const onLong = vi.fn();
    render(<Pad onLong={onLong} />);
    fireEvent.pointerDown(screen.getByTestId('pad'), { clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(screen.getByTestId('pad'));
    act(() => vi.advanceTimersByTime(1000));
    expect(onLong).not.toHaveBeenCalled();
  });

  it('does not fire when the finger slides away', () => {
    const onLong = vi.fn();
    render(<Pad onLong={onLong} />);
    fireEvent.pointerDown(screen.getByTestId('pad'), { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(screen.getByTestId('pad'), { clientX: 20, clientY: 0 });
    act(() => vi.advanceTimersByTime(1000));
    expect(onLong).not.toHaveBeenCalled();
  });
});

describe('useWakeLock', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the screen awake while active and releases on unmount', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release, released: false });
    vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } });
    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});
    expect(request).toHaveBeenCalledWith('screen');
    unmount();
    expect(release).toHaveBeenCalled();
  });

  it('does nothing when the browser has no wake lock', () => {
    vi.stubGlobal('navigator', { userAgent: 'test' });
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
