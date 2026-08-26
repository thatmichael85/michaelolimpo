import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge primitive', () => {
  it('renders with default variant and md size', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('pop-badge', 'badge--default', 'badge--md');
  });

  it('renders handwritten variant with Gaegu cursive styling', () => {
    render(<Badge variant="handwritten">👋 Hi!</Badge>);
    const badge = screen.getByText('👋 Hi!');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('pop-badge', 'badge--handwritten');
  });

  it('renders code variant with monospace styling', () => {
    render(<Badge variant="code">v1.0.0</Badge>);
    const badge = screen.getByText('v1.0.0');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('pop-badge', 'badge--code');
  });

  it('supports size modifiers (sm, md, lg)', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('badge--sm');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('badge--md');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('badge--lg');
  });

  it('merges custom className and style', () => {
    render(
      <Badge className="custom-badge" style={{ margin: '4px' }}>
        Styled
      </Badge>
    );
    const badge = screen.getByText('Styled');
    expect(badge).toHaveClass('custom-badge', 'pop-badge');
    expect(badge).toHaveStyle({ margin: '4px' });
  });
});
