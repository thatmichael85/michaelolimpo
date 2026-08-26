import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'handwritten' | 'code' | 'default';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  style,
  ...props
}: BadgeProps) {
  const classes = `pop-badge badge--${variant} badge--${size} ${className}`.trim();

  return (
    <span className={classes} style={style} {...props}>
      {children}
    </span>
  );
}
