import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubLocalStorage, stubResizeObserver } from '../test-utils';
import { useSettings } from '../useSettings';
import { SetupPage } from './SetupPage';

function Harness({ onPlay = () => {} }: { onPlay?: () => void }) {
  const api = useSettings();
  return <SetupPage {...api} onPlay={onPlay} />;
}

const message = () => screen.getByLabelText('Message') as HTMLTextAreaElement;
const typeMessage = (value: string) => fireEvent.change(message(), { target: { value } });

beforeEach(() => {
  stubLocalStorage();
  stubResizeObserver();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SetupPage', () => {
  it('shows typed text in the live preview, capped at 500 characters', () => {
    render(<Harness />);
    typeMessage('GO TEAM 🎉');
    expect(screen.getByTestId('mq-display')).toHaveTextContent('GO TEAM 🎉');
    expect(message().maxLength).toBe(500);
  });

  it('reveals dot controls only in LED/PIXEL mode and disables Outline there', () => {
    render(<Harness />);
    expect(screen.queryByLabelText('Pixel size')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'LED' }));
    expect(screen.getByLabelText('Pixel size')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Unlit dots' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Outline' })).toBeDisabled();
  });

  it('disables Outline for Monoton, which is already an outline font', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('radio', { name: 'Monoton' }));
    expect(screen.getByRole('checkbox', { name: 'Outline' })).toBeDisabled();
  });

  it('labels the text size so it is not mistaken for a dot setting', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Text size')).toBeInTheDocument();
    expect(screen.queryByLabelText('Size')).toBeNull();
  });

  it('needs a second tap to reset, keeps the text, and never uses confirm()', () => {
    const confirm = vi.spyOn(window, 'confirm');
    render(<Harness />);
    typeMessage('KEEP ME');
    fireEvent.click(screen.getByRole('radio', { name: 'LED' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('radio', { name: 'LED' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to reset' }));
    expect(screen.getByRole('radio', { name: 'Smooth' })).toBeChecked();
    expect(message().value).toBe('KEEP ME');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('applies a preset and keeps the text', () => {
    render(<Harness />);
    typeMessage('HELLO');
    fireEvent.click(screen.getByRole('button', { name: 'Stadium' }));
    expect(screen.getByRole('radio', { name: 'LED' })).toBeChecked();
    expect(message().value).toBe('HELLO');
  });

  it('disables Play for empty text and calls onPlay otherwise', () => {
    const onPlay = vi.fn();
    render(<Harness onPlay={onPlay} />);
    typeMessage('   ');
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled();
    typeMessage('GO');
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledOnce();
  });

  it('saves the sign on the device', () => {
    render(<Harness />);
    typeMessage('SAVED');
    expect(localStorage.getItem('marquee:v1')).toContain('SAVED');
  });

  it('shows tick marks and numbers on the speed bar', () => {
    render(<Harness />);
    const speed = screen.getByLabelText('Speed') as HTMLInputElement;
    expect(speed.max).toBe('20');
    const ticks = document.getElementById(speed.getAttribute('list')!)!;
    expect(ticks.querySelectorAll('option')).toHaveLength(20);
    const labels = speed.closest('.mq-field')!.querySelectorAll('.mq-tick__label');
    expect(Array.from(labels, (l) => l.textContent)).toEqual(['1', '5', '10', '15', '20']);
  });

  it('shows speed only while scrolling', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Speed')).toBeEnabled();
    fireEvent.click(screen.getByRole('radio', { name: 'Off' }));
    expect(screen.getByLabelText('Speed')).toBeDisabled();
  });
});
