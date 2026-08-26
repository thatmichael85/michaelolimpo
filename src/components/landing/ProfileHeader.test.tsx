import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileHeader } from './ProfileHeader';

describe('ProfileHeader', () => {
  it('renders user photo, name, and AI Guide human headline without banner', () => {
    render(<ProfileHeader />);
    expect(screen.getByRole('heading', { level: 1, name: 'Michael Angelo S Olimpo' })).toBeInTheDocument();
    expect(screen.getByText('AI Guide human')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Michael Angelo S Olimpo' })).toBeInTheDocument();
    expect(screen.queryByAltText(/Background Banner/i)).not.toBeInTheDocument();
  });
});
