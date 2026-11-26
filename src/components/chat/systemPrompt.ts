import rulesMd from './rules.md?raw';
import factsMd from './facts.md?raw';

/** Rules first, then the public fact sheet. Everything here ships to the browser. */
export function buildSystemPrompt(rules: string, facts: string): string {
  return `${rules.trim()}\n\nFACTS:\n${facts.trim()}`;
}

export const SYSTEM_PROMPT = buildSystemPrompt(rulesMd, factsMd);

const normalise = (s: string) =>
  s.toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

/** Distinctive sentences from the rules (not the public facts). A reply containing one is reciting them. */
const FINGERPRINTS = rulesMd
  .split('\n')
  .map((line) => line.replace(/^\s*-\s*/, ''))
  .flatMap((line) => line.split(/(?<=[.!?:])\s+/))
  .map((s) => normalise(s).replace(/[.!?:]+$/, ''))
  .filter((s) => s.length >= 20 && !s.includes('i can only answer questions about michael'));

/**
 * Small models recite their instructions when asked, whatever the rules say, so this is checked
 * in code: true when a reply reproduces the rules.
 */
export function revealsInstructions(reply: string): boolean {
  const text = normalise(reply);
  return text.includes('rules:') || FINGERPRINTS.some((f) => text.includes(f));
}
