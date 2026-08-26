import { getDisplayHostname } from '../../utils/hostname';

export interface FooterProps {
  hostname?: string;
  year?: number;
}

export function Footer({ hostname, year }: FooterProps) {
  const displayString = getDisplayHostname(hostname, year);

  return (
    <footer className="colophon-text" aria-label="Colophon">
      {displayString}
    </footer>
  );
}
