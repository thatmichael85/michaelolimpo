import { Button as AstryxButton } from '@astryxdesign/core/Button';
import type { ReactNode } from 'react';

export interface ButtonProps {
  children?: ReactNode;
  label?: string;
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

export function Button({
  children,
  label = 'Connect on LinkedIn',
  href,
  target,
  rel,
  className = '',
  onClick,
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <AstryxButton
      label={label}
      href={href}
      target={target}
      rel={rel}
      className={`linkedin-btn ${className}`}
      onClick={onClick}
      aria-label={ariaLabel || label}
    >
      {children}
    </AstryxButton>
  );
}
