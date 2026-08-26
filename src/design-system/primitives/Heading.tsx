import type { HTMLAttributes, ReactNode, CSSProperties } from 'react';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}

export function Heading({ level = 1, children, className = '', style, ...props }: HeadingProps) {
  const baseStyle: CSSProperties =
    level === 1
      ? {
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          ...style,
        }
      : {
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          lineHeight: 1.3,
          ...style,
        };

  if (level === 1) {
    return (
      <h1 className={`person-name ${className}`} style={baseStyle} {...props}>
        {children}
      </h1>
    );
  }

  if (level === 2) {
    return (
      <h2 className={`person-name ${className}`} style={baseStyle} {...props}>
        {children}
      </h2>
    );
  }

  return (
    <h3 className={`person-name ${className}`} style={baseStyle} {...props}>
      {children}
    </h3>
  );
}
