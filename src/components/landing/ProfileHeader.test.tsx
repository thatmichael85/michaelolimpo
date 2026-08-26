import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileHeader } from './ProfileHeader';

describe('ProfileHeader', () => {
  it('renders dinosaur background banner, user photo, name, and AI Guide human headline', () => {
    render(<ProfileHeader />);
    expect(screen.getByAltText(/Doodle Unicorn & Dinosaur Background Banner/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Michael Angelo S Olimpo' })).toBeInTheDocument();
    expect(screen.getByText('AI Guide human')).toBeInTheDocument();
    expect(screen.getByAltText('Michael Angelo S Olimpo')).toBeInTheDocument();
  });
});
