import { Card as AstryxCard } from '@astryxdesign/core/Card';
import type { ReactNode, CSSProperties } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className = '', style, ...props }: CardProps) {
  return (
    <AstryxCard
      className={`cartoon-card ${className}`}
      style={style}
      {...props}
    >
      {children}
    </AstryxCard>
  );
}
