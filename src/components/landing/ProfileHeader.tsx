import { Avatar } from '../../design-system/primitives/Avatar';
import { Heading } from '../../design-system/primitives/Heading';

export interface ProfileHeaderProps {
  bannerSrc?: string;
  avatarSrc?: string;
  name?: string;
  headline?: string;
}

export function ProfileHeader({
  bannerSrc = '/assets/banner.png',
  avatarSrc = '/assets/avatar.png',
  name = 'Michael Angelo S Olimpo',
  headline = 'AI Guide human',
}: ProfileHeaderProps) {
  return (
    <>
      <div className="banner-container">
        <img
          src={bannerSrc}
          alt="Doodle Unicorn & Dinosaur Background Banner"
          className="banner-img"
        />
      </div>

      <header className="profile-header">
        <Avatar src={avatarSrc} alt={name} badgeText="👋 Hi!" />

        <div className="identity-info">
          <Heading level={1}>{name}</Heading>
          <div className="person-headline">
            <span>{headline}</span>
          </div>
        </div>
      </header>
    </>
  );
}
