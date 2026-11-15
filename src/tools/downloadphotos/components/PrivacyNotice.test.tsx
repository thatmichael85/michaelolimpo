import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { PrivacyNotice } from './PrivacyNotice';

it('starts collapsed and lets the user expand and collapse the full notice', () => {
  render(<PrivacyNotice />);
  const summary = screen.getByText('Why this exists · privacy & disclaimers');
  const details = summary.closest('details')!;
  const finePrint = screen.getByText(/Personal, non-commercial project/);
  expect(details).not.toHaveAttribute('open');
  expect(finePrint).not.toBeVisible();
  fireEvent.click(summary);
  expect(details).toHaveAttribute('open');
  expect(finePrint).toBeVisible();
  fireEvent.click(summary);
  expect(details).not.toHaveAttribute('open');
});
