import { describe, it, expect } from 'vitest';
import { getDisplayHostname } from './hostname';

describe('getDisplayHostname', () => {
  it('returns default domain mikeosoft.ai when hostname is empty', () => {
    expect(getDisplayHostname('', 2026)).toBe('mikeosoft.ai · 2026');
  });

  it('returns default domain mikeosoft.ai when running on localhost', () => {
    expect(getDisplayHostname('localhost', 2026)).toBe('mikeosoft.ai · 2026');
  });

  it('returns default domain mikeosoft.ai when running on 127.0.0.1', () => {
    expect(getDisplayHostname('127.0.0.1', 2026)).toBe('mikeosoft.ai · 2026');
  });

  it('returns actual hostname when deployed on a custom domain', () => {
    expect(getDisplayHostname('mikeosoft.ai', 2026)).toBe('mikeosoft.ai · 2026');
    expect(getDisplayHostname('michaelolimpo.com', 2026)).toBe('michaelolimpo.com · 2026');
  });
});
