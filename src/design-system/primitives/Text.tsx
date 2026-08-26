import type { HTMLAttributes, ReactNode } from 'react';

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export function Text({ variant = 'primary', children, className = '', style, ...props }: TextProps) {
  const color =
    variant === 'primary'
      ? 'var(--text-primary)'
      : variant === 'secondary'
      ? 'var(--text-secondary)'
      : 'var(--text-muted)';

  return (
    <p
      className={className}
      style={{
        color,
        lineHeight: 1.6,
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}
