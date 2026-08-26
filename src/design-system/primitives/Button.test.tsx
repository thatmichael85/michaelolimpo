import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button primitive', () => {
  it('renders a button element by default when href is omitted', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toHaveClass('pop-btn', 'pop-btn--primary', 'pop-btn--md');
  });

  it('renders an anchor element when href is provided', () => {
    render(
      <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
        Visit Example
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Visit Example' });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveClass('pop-btn', 'pop-btn--primary', 'pop-btn--md');
  });

  it('supports all variant classes (primary, secondary, outline, ghost)', () => {
    const { rerender } = render(<Button variant="primary">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--primary');

    rerender(<Button variant="secondary">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--secondary');

    rerender(<Button variant="outline">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--outline');

    rerender(<Button variant="ghost">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--ghost');
  });

  it('supports all size classes (sm, md, lg)', () => {
    const { rerender } = render(<Button size="sm">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--sm');

    rerender(<Button size="md">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--md');

    rerender(<Button size="lg">Action</Button>);
    expect(screen.getByRole('button')).toHaveClass('pop-btn--lg');
  });

  it('triggers onClick handlers when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Press' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className and additional props', () => {
    render(
      <Button className="custom-test-class" aria-label="Accessible button">
        Custom
      </Button>
    );
    const btn = screen.getByLabelText('Accessible button');
    expect(btn).toHaveClass('custom-test-class');
    expect(btn).toHaveClass('pop-btn');
  });
});
