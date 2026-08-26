import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectCTA } from './ConnectCTA';

describe('ConnectCTA', () => {
  it('renders LinkedIn link with target blank and rel', () => {
    render(<ConnectCTA />);
    const link = screen.getByRole('link', { name: /Connect on LinkedIn/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/michael-angelo-s-olimpo/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
