import { Heading as AstryxHeading } from '@astryxdesign/core/Heading';
import type { HeadingLevel } from '@astryxdesign/core/Heading';
import type { TextColor } from '@astryxdesign/core/theme';
import type { ReactNode, CSSProperties } from 'react';

export interface HeadingProps {
  level?: HeadingLevel;
  children: ReactNode;
  className?: string;
  color?: TextColor;
  style?: CSSProperties;
}

export function Heading({ level = 1, children, className = '', color = 'primary', style, ...props }: HeadingProps) {
  return (
    <AstryxHeading
      level={level}
      color={color}
      className={`person-name ${className}`}
      style={style}
      {...props}
    >
      {children}
    </AstryxHeading>
  );
}
