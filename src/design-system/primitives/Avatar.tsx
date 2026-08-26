import type { HTMLAttributes, ReactNode } from 'react';
import { Badge } from './Badge';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  badgeText?: ReactNode;
  size?: number;
  className?: string;
}

export function Avatar({
  src,
  alt,
  badgeText = (
    <>
      <span aria-hidden="true">👋</span> Hi!
    </>
  ),
  size = 88,
  className = '',
  style,
  ...props
}: AvatarProps) {
  return (
    <div
      className={`avatar-wrapper ${className}`.trim()}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        height: size,
        ...style,
      }}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className="avatar-img"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'var(--radius-full)',
          objectFit: 'cover',
          border: '3px solid var(--border-color)',
          boxShadow: 'var(--shadow-pop-sm)',
          backgroundColor: 'var(--bg-card)',
          display: 'block',
          transition: 'transform var(--duration-fast) var(--ease-emphasized)',
        }}
      />
      {badgeText && (
        <Badge
          variant="handwritten"
          size="sm"
          className="avatar-doodle-badge"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            zIndex: 1,
          }}
        >
          {badgeText}
        </Badge>
      )}
    </div>
  );
}
