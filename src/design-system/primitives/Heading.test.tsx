import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';

describe('Heading primitive', () => {
  it('renders an h1 by default', () => {
    render(<Heading>Main Title</Heading>);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Main Title' });
    expect(h1).toBeInTheDocument();
    expect(h1.tagName).toBe('H1');
    expect(h1).toHaveClass('heading', 'heading--h1');
  });

  it('renders h2 through h6 when corresponding level prop is provided', () => {
    const { rerender } = render(<Heading level={2}>Section Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('heading--h2');

    rerender(<Heading level={3}>Sub section</Heading>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('heading--h3');

    rerender(<Heading level={4}>Level 4</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 })).toHaveClass('heading--h4');

    rerender(<Heading level={5}>Level 5</Heading>);
    expect(screen.getByRole('heading', { level: 5 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5 })).toHaveClass('heading--h5');

    rerender(<Heading level={6}>Level 6</Heading>);
    expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 6 })).toHaveClass('heading--h6');
  });

  it('merges custom className and style', () => {
    render(
      <Heading level={1} className="custom-heading" style={{ color: 'red' }}>
        Custom Heading
      </Heading>
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('heading', 'heading--h1', 'custom-heading');
    expect(heading).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
