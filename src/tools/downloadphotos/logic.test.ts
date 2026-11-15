import { describe, it, expect, vi, afterEach } from 'vitest';
import { encCreds } from './crypto';
import { fileName, type Photo } from './api';
import { makePacer } from './pacer';
import { addPhotos, sectionKeys } from './gallery';

const photo = (id: number, date: string): Photo => ({ id, date, url: `https://m/x/${id}.png`, thumb: '' });

describe('downloadphotos logic', () => {
  afterEach(() => vi.useRealTimers());

  it('encrypts credentials like the ChildFirst app (DES/ECB/PKCS7, known vector)', () => {
    expect(encCreds('test')).toBe('zEAfONyAuns=');
  });

  it('keeps the original file-name scheme (so resume works on old folders)', () => {
    expect(fileName({ id: 42, date: '2025-03-04', url: 'https://cdn/a/b.JPEG?sig=1' }, 7)).toBe('2025-03-04_42.JPEG');
    expect(fileName({ id: null, date: '', url: 'https://cdn/a/noext' }, 7)).toBe('undated_n7.jpg');
  });

  it('paces calls at least gapMs apart', async () => {
    vi.useFakeTimers();
    const pace = makePacer(900);
    const starts: number[] = [];
    const run = Promise.all([0, 1, 2].map(() => pace().then(() => starts.push(Date.now()))));
    await vi.advanceTimersByTimeAsync(5000);
    await run;
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(900);
    expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(900);
  });

  it('groups photos by month, dedupes by id, sorts newest first with undated last', () => {
    const seen = new Set<Photo['id']>();
    let p = addPhotos({}, [photo(1, '2025-03-02'), photo(2, '2025-01-09'), photo(3, '')], seen);
    p = addPhotos(p, [photo(1, '2025-03-02'), photo(4, '2025-03-01')], seen);
    expect(p['2025-03'].map((x) => x.id)).toEqual([1, 4]);
    expect(sectionKeys(p)).toEqual(['2025-03', '2025-01', 'undated']);
  });

});
