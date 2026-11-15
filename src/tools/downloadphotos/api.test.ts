import { afterEach, expect, it, vi } from 'vitest';
import { taggedPage } from './api';
import { listAll } from './download';

vi.mock('./pacer', async original => ({
  ...await original<typeof import('./pacer')>(), makePacer: () => async () => {},
}));
afterEach(() => vi.unstubAllGlobals());

it('requests gallery pages of 50 while bulk download keeps pages of 30', async () => {
  const fetchMock = vi.fn().mockImplementation(async () => Response.json({ data: {
    results: Array.from({ length: 30 }, (_, id) => ({ id, full_url: `https://example.test/${id}.jpg` })),
  } }));
  vi.stubGlobal('fetch', fetchMock);
  const gallery = await taggedPage('mock', 123, 1, 50);
  expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('page_size')).toBe('50');
  // A short page ends pagination when the API omits its next-page indicator.
  expect(gallery.next).toBe(false);
  fetchMock.mockImplementationOnce(async () => Response.json({ data: { results: [], next: null } }));
  await listAll('mock', 123, vi.fn());
  expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('page_size')).toBe('30');
});
