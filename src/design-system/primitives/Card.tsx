import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`cartoon-card ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '2px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition:
          'background-color var(--duration-normal) var(--ease-standard), border-color var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
