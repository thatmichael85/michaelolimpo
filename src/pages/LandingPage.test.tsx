import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders all key landing page sections', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Michael Angelo S Olimpo' })).toBeInTheDocument();
    expect(screen.getByText('AI Guide human')).toBeInTheDocument();
    expect(screen.getByText(/Guiding AI at Meta/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Connect on LinkedIn/i })).toBeInTheDocument();
  });
});
