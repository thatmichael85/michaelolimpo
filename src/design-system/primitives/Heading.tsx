import type { HTMLAttributes, ReactNode, CSSProperties } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  children: ReactNode;
  className?: string;
}

export function Heading({
  level = 1,
  children,
  className = '',
  style,
  ...props
}: HeadingProps) {
  const getLevelStyle = (lvl: HeadingLevel): CSSProperties => {
    switch (lvl) {
      case 1:
        return {
          fontSize: 'var(--text-2xl)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
        };
      case 2:
        return {
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          lineHeight: 1.3,
        };
      case 3:
        return {
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          lineHeight: 1.3,
        };
      case 4:
        return {
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        };
      case 5:
        return {
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
        };
      case 6:
        return {
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          lineHeight: 1.4,
        };
    }
  };

  const baseStyle: CSSProperties = {
    ...getLevelStyle(level),
    ...style,
  };

  const classes = `heading heading--h${level} ${className}`.trim();
  const Tag = `h${level}` as const;

  return (
    <Tag className={classes} style={baseStyle} {...props}>
      {children}
    </Tag>
  );
}
