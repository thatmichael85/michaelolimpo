import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('renders computer icon (🖥️) when on system mode and triggers callback', () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="system"
        resolvedTheme="light"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /Theme: System/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('🖥️')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('renders sun icon (☀️) when on light mode', () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="light"
        resolvedTheme="light"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /Theme: Light/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('☀️')).toBeInTheDocument();
  });

  it('renders moon icon (🌙) when on dark mode', () => {
    const handleToggle = vi.fn();
    render(
      <ThemeToggle
        preference="dark"
        resolvedTheme="dark"
        onToggleTheme={handleToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /Theme: Dark/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });
});
