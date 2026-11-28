import rulesMd from './rules.md?raw';
import factsMd from './facts.md?raw';
import { BLOCKED_REPLY } from './useNanoChat';

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

const startsWithRefusal = (reply: string) => reply.trimStart().toLowerCase().startsWith(BLOCKED_REPLY.toLowerCase());
const REFUSAL_SENTENCE = /\s*I can only answer questions about Michael\./gi;

/** The one-sentence refusals rules.md asks for. */
const REFUSALS = [BLOCKED_REPLY, "I can't help with that."].map((r) => r.toLowerCase());

/** The refusal a reply opens with, once more text follows it (Nano tends to add a lecture), else null. */
export function refusalThenMore(reply: string): string | null {
  const text = reply.trimStart();
  const opening = REFUSALS.find((r) => text.toLowerCase().replace(/’/g, "'").startsWith(r));
  if (!opening || text.slice(opening.length).trim() === '') return null;
  return text.slice(0, opening.length);
}


/** Nano often tacks the off-topic refusal onto a real answer ("…LinkedIn.\n\nI can only answer…"); drop it. */
export function stripTackedOnRefusal(reply: string): string {
  return startsWithRefusal(reply) ? reply : reply.replace(REFUSAL_SENTENCE, '');
}

/** Crisis-line advice must always reach the visitor, even when it follows a refusal. */
const CRISIS = /\b988\b|emergency|crisis|lifeline|hotline/i;

/**
 * The panel's tidyReply, applied to the whole reply so far: cuts a lecture after a refusal (unless it
 * carries crisis-line advice) and drops the off-topic refusal tacked onto a real answer.
 */
export function tidyReply(reply: string): string {
  const refusal = refusalThenMore(reply);
  if (refusal) return CRISIS.test(reply) ? reply : refusal;
  return stripTackedOnRefusal(reply);
}
