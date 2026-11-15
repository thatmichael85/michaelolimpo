import { StrictMode, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { taggedPage } from './api';
import { useGallery } from './useGallery';
vi.mock('./api', async (original) => ({ ...await original<typeof import('./api')>(), taggedPage: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it('keeps all photos under StrictMode and requests consecutive pages without month navigation', async () => {
  vi.mocked(taggedPage)
    .mockResolvedValueOnce({ results: [{ id: 1, date: '2026-11-01', url: 'a', thumb: 'a' }], next: true, count: 2 })
    .mockResolvedValueOnce({ results: [{ id: 2, date: '2026-10-01', url: 'b', thumb: 'b' }], next: false, count: 2 });
  const unauthorized = vi.fn();
  const { result } = renderHook(() => useGallery('mock', 123, unauthorized), {
    wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
  });
  await waitFor(() => expect(result.current.flat).toHaveLength(1));
  act(() => result.current.setSentinelVisible(true));
  await waitFor(() => expect(result.current.allDone).toBe(true));
  expect(result.current.flat.map(p => p.id)).toEqual([1, 2]);
  expect(result.current.keys).toEqual(['2026-11', '2026-10']);
  expect(taggedPage).toHaveBeenNthCalledWith(1, 'mock', 123, 1, 50);
  expect(taggedPage).toHaveBeenNthCalledWith(2, 'mock', 123, 2, 50);
});
it('retries a failed page without skipping it', async () => {
  vi.mocked(taggedPage).mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ results: [], next: false });
  const unauthorized = vi.fn();
  const { result } = renderHook(() => useGallery('mock', 456, unauthorized));
  await waitFor(() => expect(result.current.list.error).toContain('offline'));
  await act(() => result.current.retryList());
  expect(result.current.allDone).toBe(true);
  expect(vi.mocked(taggedPage).mock.calls.map(call => call[2])).toEqual([1, 1]);
});
