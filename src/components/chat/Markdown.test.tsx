import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

const renderMd = (text: string) => render(<Markdown text={text} />).container;

describe('Markdown', () => {
  it('renders [text](url) as a safe external link', () => {
    renderMd('Find him on [LinkedIn](https://www.linkedin.com/in/x/).');
    const link = screen.getByRole('link', { name: 'LinkedIn' });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/x/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a link whose text is its URL only once', () => {
    const c = renderMd('LinkedIn: [https://www.linkedin.com/in/x/](https://www.linkedin.com/in/x/)');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(c.textContent).toBe('LinkedIn: https://www.linkedin.com/in/x/');
  });

  it('links bare URLs and leaves trailing punctuation outside the link', () => {
    renderMd('See https://mikeosoft.ai/tools/marquee/.');
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://mikeosoft.ai/tools/marquee/');
  });

  it('does not link unsafe URLs', () => {
    const c = renderMd('[click](javascript:alert(1))');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(c.textContent).toContain('click');
  });

  it('renders bold, italic and inline code', () => {
    const c = renderMd('**Bold**, *italic*, _also_ and `code`');
    expect(c.querySelector('strong')).toHaveTextContent('Bold');
    expect(c.querySelectorAll('em')).toHaveLength(2);
    expect(c.querySelector('code')).toHaveTextContent('code');
  });

  it('renders bullet and numbered lists', () => {
    const c = renderMd('Tools:\n- Marquee\n- Photo Export\n\n1. First\n2. Second');
    expect(c.querySelectorAll('ul > li')).toHaveLength(2);
    expect(c.querySelectorAll('ol > li')).toHaveLength(2);
    expect(c.querySelector('p')).toHaveTextContent('Tools:');
  });

  it('collapses runs of blank lines into separate paragraphs', () => {
    const c = renderMd('A\n\n\n\nB\n\n');
    const ps = c.querySelectorAll('p');
    expect(ps).toHaveLength(2);
    expect(ps[0]).toHaveTextContent('A');
    expect(ps[1]).toHaveTextContent('B');
  });

  it('keeps single line breaks inside a paragraph', () => {
    const c = renderMd('Line one\nLine two');
    expect(c.querySelectorAll('p')).toHaveLength(1);
    expect(c.querySelector('br')).toBeInTheDocument();
  });

  it('shows raw HTML as text instead of rendering it', () => {
    const c = renderMd('<img src=x onerror="alert(1)">');
    expect(c.querySelector('img')).not.toBeInTheDocument();
    expect(c.textContent).toContain('<img');
  });
});
