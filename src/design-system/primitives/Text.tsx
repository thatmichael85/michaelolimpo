import { Text as AstryxText } from '@astryxdesign/core/Text';
import type { TextColor } from '@astryxdesign/core/theme';
import type { ReactNode, CSSProperties } from 'react';

export interface TextProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'disabled' | 'accent' | 'inherit';
  className?: string;
  style?: CSSProperties;
}

export function Text({ variant = 'primary', children, className = '', style, ...props }: TextProps) {
  return (
    <AstryxText
      display="block"
      color={variant as TextColor}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </AstryxText>
  );
}
