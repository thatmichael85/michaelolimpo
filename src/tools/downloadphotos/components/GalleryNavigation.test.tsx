import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { GalleryNavigation } from './GalleryNavigation';
afterEach(() => vi.restoreAllMocks());
it('shows scroll-to-top after scrolling and returns to the top', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 600 });
  render(<GalleryNavigation months={['2026-11', '2025-01']} />);
  fireEvent.scroll(window);
  fireEvent.click(screen.getByRole('button', { name: 'Scroll to top' }));
  expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  fireEvent.scroll(window);
  expect(screen.queryByRole('button', { name: 'Scroll to top' })).not.toBeInTheDocument();
});
it('allows keyboard navigation to loaded month sections', () => {
  const section = document.createElement('section');
  section.dataset.monthKey = '2025-01';
  section.className = 'cf-month';
  section.scrollIntoView = vi.fn();
  document.body.append(section);
  render(<GalleryNavigation months={['2026-11', '2025-01']} />);
  fireEvent.keyDown(screen.getByRole('slider', { name: 'Photo date timeline' }), { key: 'End' });
  expect(section.scrollIntoView).toHaveBeenCalled();
  section.remove();
});
