import type { ReactNode } from 'react';

/**
 * Tiny, safe Markdown renderer for Gemini Nano's replies: paragraphs, line breaks,
 * bullet/numbered lists, links, bold, italic and inline code. It builds React elements
 * (never innerHTML), so raw HTML in a reply is shown as text, and only http(s)/mailto links render.
 */
export function Markdown({ text }: { text: string }) {
  return <>{renderBlocks(text)}</>;
}

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const INLINE =
  /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\s][^*\n]*)\*|(?<![\w])_([^_\n]+)_(?![\w])|(https?:\/\/[^\s<>()[\]]+)/g;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

type Block = { kind: 'p' | 'ul' | 'ol'; lines: string[] };

function renderBlocks(text: string): ReactNode[] {
  const blocks: Block[] = [];
  for (const chunk of text.trim().split(/\n[ \t]*\n+/)) {
    let current: Block | null = null;
    for (const line of chunk.split('\n')) {
      const bullet = BULLET.exec(line);
      const numbered = bullet ? null : NUMBERED.exec(line);
      const kind: Block['kind'] = bullet ? 'ul' : numbered ? 'ol' : 'p';
      const content = bullet?.[1] ?? numbered?.[1] ?? line;
      if (!current || current.kind !== kind) {
        current = { kind, lines: [] };
        blocks.push(current);
      }
      current.lines.push(content);
    }
  }

  return blocks
    .filter((b) => b.lines.some((l) => l.trim()))
    .map((b, i) => {
      if (b.kind === 'p') {
        const lines = b.lines.map((l) => l.trim()).filter(Boolean);
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </span>
            ))}
          </p>
        );
      }
      const items = b.lines.map((l, j) => <li key={j}>{renderInline(l.trim())}</li>);
      return b.kind === 'ul' ? <ul key={i}>{items}</ul> : <ol key={i}>{items}</ol>;
    });
}

function link(href: string, label: string, key: number): ReactNode {
  if (!SAFE_URL.test(href)) return label;
  return (
    <a key={key} href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function renderInline(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of line.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(line.slice(last, start));
    const [whole, linkText, linkUrl, bold, code, italic, underscoreItalic, bareUrl] = m;
    if (linkText !== undefined) out.push(link(linkUrl, linkText, key++));
    else if (bold !== undefined) out.push(<strong key={key++}>{bold}</strong>);
    else if (code !== undefined) out.push(<code key={key++}>{code}</code>);
    else if (italic !== undefined) out.push(<em key={key++}>{italic}</em>);
    else if (underscoreItalic !== undefined) out.push(<em key={key++}>{underscoreItalic}</em>);
    else if (bareUrl !== undefined) {
      // Keep sentence punctuation outside the link: "see https://x.ai/." → link + "."
      const url = bareUrl.replace(/[.,!?;:'"]+$/, '');
      out.push(link(url, url, key++));
      if (url.length < bareUrl.length) out.push(bareUrl.slice(url.length));
    } else out.push(whole);
    last = start + whole.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
