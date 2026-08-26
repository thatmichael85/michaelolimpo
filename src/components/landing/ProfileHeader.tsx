import { Avatar } from '../../design-system/primitives/Avatar';
import { Heading } from '../../design-system/primitives/Heading';

export interface ProfileHeaderProps {
  bannerSrc?: string;
  bannerDarkSrc?: string;
  avatarSrc?: string;
  name?: string;
  headline?: string;
}

export function ProfileHeader({
  bannerSrc = '/assets/banner.png',
  bannerDarkSrc = '/assets/banner-dark.png',
  avatarSrc = '/assets/avatar.png',
  name = 'Michael Angelo S Olimpo',
  headline = 'AI Guide human',
}: ProfileHeaderProps) {
  return (
    <>
      <div className="banner-container">
        <img
          src={bannerSrc}
          alt="Light Doodle Unicorn & Dinosaur Background Banner"
          className="banner-img banner-img-light"
        />
        <img
          src={bannerDarkSrc}
          alt="Midnight Doodle Unicorn & Dinosaur Background Banner"
          className="banner-img banner-img-dark"
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
