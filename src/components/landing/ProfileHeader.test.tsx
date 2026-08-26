import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileHeader } from './ProfileHeader';

describe('ProfileHeader', () => {
  it('renders light and dark dinosaur background banners, user photo, name, and AI Guide human headline', () => {
    render(<ProfileHeader />);
    expect(screen.getByAltText(/Light Doodle Unicorn & Dinosaur Background Banner/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Midnight Doodle Unicorn & Dinosaur Background Banner/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Michael Angelo S Olimpo' })).toBeInTheDocument();
    expect(screen.getByText('AI Guide human')).toBeInTheDocument();
    expect(screen.getByAltText('Michael Angelo S Olimpo')).toBeInTheDocument();
  });
});
