import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders dynamic domain and year', () => {
    render(<Footer hostname="mikeosoft.ai" year={2026} />);
    expect(screen.getByText('mikeosoft.ai · 2026')).toBeInTheDocument();
  });
});
