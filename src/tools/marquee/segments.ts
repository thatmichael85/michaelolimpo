export interface Segment {
  text: string;
  emoji: boolean;
}

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Splits text into runs of letters and single emoji graphemes, so letters can be
 * coloured/glowed while emoji keep their own look (👍🏽 and 👨‍👩‍👧 stay whole).
 */
export function segment(text: string, opts: { caps: boolean; singleLine: boolean }): Segment[] {
  const source = opts.singleLine ? text.replace(/\r?\n/g, ' ') : text;
  const out: Segment[] = [];
  for (const { segment: g } of graphemes.segment(source)) {
    if (EMOJI.test(g)) {
      out.push({ text: g, emoji: true });
      continue;
    }
    const letters = opts.caps ? g.toUpperCase() : g;
    const last = out.at(-1);
    if (last && !last.emoji) last.text += letters;
    else out.push({ text: letters, emoji: false });
  }
  return out;
}
