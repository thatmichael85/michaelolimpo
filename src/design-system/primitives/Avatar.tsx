import { Avatar as AstryxAvatar } from '@astryxdesign/core/Avatar';
import type { AvatarSize } from '@astryxdesign/core/Avatar';

export interface AvatarProps {
  src: string;
  alt: string;
  badgeText?: string;
  size?: AvatarSize;
}

export function Avatar({ src, alt, badgeText = '👋 Hi!', size = 96 }: AvatarProps) {
  return (
    <div className="avatar-wrapper">
      <AstryxAvatar
        src={src}
        alt={alt}
        name={alt}
        size={size}
        className="avatar-img"
      />
      {badgeText && (
        <span className="avatar-doodle-badge">
          {badgeText}
        </span>
      )}
    </div>
  );
}
