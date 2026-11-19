import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings';
import { stubLocalStorage, stubResizeObserver } from '../test-utils';
import { MarqueeApp } from './MarqueeApp';
import { PlayView } from './PlayView';

const hold = (el: HTMLElement) => {
  fireEvent.pointerDown(el, { clientX: 10, clientY: 10 });
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.pointerUp(el);
};

beforeEach(() => {
  vi.useFakeTimers();
  stubLocalStorage();
  stubResizeObserver();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('PlayView', () => {
  it('hides controls until a press-and-hold, then auto-hides Edit again', () => {
    render(<PlayView settings={DEFAULT_SETTINGS} onExit={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    hold(screen.getByTestId('mq-play'));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  it('a quick tap does not reveal Edit', () => {
    render(<PlayView settings={DEFAULT_SETTINGS} onExit={() => {}} />);
    fireEvent.pointerDown(screen.getByTestId('mq-play'), { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(screen.getByTestId('mq-play'));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  it('tells you how to get back, then gets out of the way', () => {
    render(<PlayView settings={DEFAULT_SETTINGS} onExit={() => {}} />);
    expect(screen.getByText('Press and hold anywhere to edit')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText('Press and hold anywhere to edit')).toBeNull();
  });

  it('Escape returns to setup (keyboard)', () => {
    const onExit = vi.fn();
    render(<PlayView settings={DEFAULT_SETTINGS} onExit={onExit} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('leaving browser full screen returns to setup', () => {
    const onExit = vi.fn();
    render(<PlayView settings={DEFAULT_SETTINGS} onExit={onExit} />);
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.body });
    fireEvent(document, new Event('fullscreenchange'));
    expect(onExit).not.toHaveBeenCalled();
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
    fireEvent(document, new Event('fullscreenchange'));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('Edit returns to setup', () => {
    const onExit = vi.fn();
    render(<PlayView settings={DEFAULT_SETTINGS} onExit={onExit} />);
    hold(screen.getByTestId('mq-play'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});

describe('MarqueeApp', () => {
  it('goes from Setup to Play and back', () => {
    render(<MarqueeApp />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(screen.getByTestId('mq-play')).toBeInTheDocument();
    expect(screen.queryByLabelText('Message')).toBeNull();
    hold(screen.getByTestId('mq-play'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });
});
