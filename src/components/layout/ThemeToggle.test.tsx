import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders floating icon-only toggle button with dynamic label and calls callback on click', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(<ThemeToggle currentTheme="light" onToggleTheme={handleToggle} />);
    
    const btn = screen.getByRole('button', { name: 'Switch to Dark Mode' });
    expect(btn).toBeInTheDocument();
    
    fireEvent.click(btn);
    expect(handleToggle).toHaveBeenCalledTimes(1);

    rerender(<ThemeToggle currentTheme="dark" onToggleTheme={handleToggle} />);
    expect(screen.getByRole('button', { name: 'Switch to Light Mode' })).toBeInTheDocument();
  });
});
