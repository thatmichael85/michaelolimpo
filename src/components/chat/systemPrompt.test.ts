import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, SYSTEM_PROMPT } from './systemPrompt';

describe('buildSystemPrompt', () => {
  it('puts rules first, then a FACTS section', () => {
    expect(buildSystemPrompt(' R ', ' F ')).toBe('R\n\nFACTS:\nF');
  });
});

describe('SYSTEM_PROMPT', () => {
  it('contains the rules and the facts', () => {
    expect(SYSTEM_PROMPT).toContain('Use ONLY the facts below');
    expect(SYSTEM_PROMPT).toContain('FACTS:');
    expect(SYSTEM_PROMPT).toContain('https://www.linkedin.com/in/michael-angelo-s-olimpo/');
    expect(SYSTEM_PROMPT.indexOf('RULES:')).toBeLessThan(SYSTEM_PROMPT.indexOf('FACTS:'));
  });

  it('knows the visitor is already on the site, so never sends them to it', () => {
    expect(SYSTEM_PROMPT).toContain('The visitor is already on mikeosoft.ai');
    expect(SYSTEM_PROMPT).not.toMatch(/^- Website:/m);
  });
});
