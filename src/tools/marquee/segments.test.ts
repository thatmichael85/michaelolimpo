import { describe, expect, it } from 'vitest';
import { segment } from './segments';

describe('segment', () => {
  it('keeps complex emoji whole and uppercases letters only', () => {
    expect(segment('Hi 👍🏽👨‍👩‍👧🇸🇬❤️!', { caps: true, singleLine: true })).toEqual([
      { text: 'HI ', emoji: false },
      { text: '👍🏽', emoji: true },
      { text: '👨‍👩‍👧', emoji: true },
      { text: '🇸🇬', emoji: true },
      { text: '❤️', emoji: true },
      { text: '!', emoji: false },
    ]);
  });

  it('turns newlines into spaces for single-line signs', () => {
    expect(segment('a\nb', { caps: false, singleLine: true })).toEqual([{ text: 'a b', emoji: false }]);
    expect(segment('a\nb', { caps: false, singleLine: false })).toEqual([{ text: 'a\nb', emoji: false }]);
  });

  it('does not treat digits or # as emoji', () => {
    expect(segment('#1', { caps: false, singleLine: true })).toEqual([{ text: '#1', emoji: false }]);
  });

  it('returns nothing for empty text', () => {
    expect(segment('', { caps: false, singleLine: true })).toEqual([]);
  });
});
