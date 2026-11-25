import rulesMd from './rules.md?raw';
import factsMd from './facts.md?raw';

/** Rules first, then the public fact sheet. Everything here ships to the browser. */
export function buildSystemPrompt(rules: string, facts: string): string {
  return `${rules.trim()}\n\nFACTS:\n${facts.trim()}`;
}

export const SYSTEM_PROMPT = buildSystemPrompt(rulesMd, factsMd);
