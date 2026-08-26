import { Avatar } from '../../design-system/primitives/Avatar';
import { Heading } from '../../design-system/primitives/Heading';

export interface ProfileHeaderProps {
  avatarSrc?: string;
  name?: string;
  headline?: string;
}

export function ProfileHeader({
  avatarSrc = '/assets/avatar.png',
  name = 'Michael Angelo S Olimpo',
  headline = 'AI Guide human',
}: ProfileHeaderProps) {
  return (
    <header className="profile-header">
      <Avatar src={avatarSrc} alt={name} badgeText="👋 Hi!" />

      <div className="identity-info">
        <Heading level={1}>{name}</Heading>
        <div className="person-headline">
          <span>{headline}</span>
        </div>
      </div>
    </header>
  );
}
