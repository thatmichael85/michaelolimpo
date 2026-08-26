import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BioBlock } from './BioBlock';

describe('BioBlock', () => {
  it('renders guiding AI statement and father quote', () => {
    render(<BioBlock />);
    expect(screen.getByText(/Guiding AI at Meta to build internal tools/i)).toBeInTheDocument();
    expect(screen.getByText(/Father of 3 kids, drowning in love and work/i)).toBeInTheDocument();
  });
});
