import { Card } from '../design-system/primitives/Card';
import { ProfileHeader } from '../components/landing/ProfileHeader';
import { BioBlock } from '../components/landing/BioBlock';
import { ConnectCTA } from '../components/landing/ConnectCTA';
import { ToolsShowcase } from '../components/landing/ToolsShowcase';

export function LandingPage() {
  return (
    <main className="landing-wrapper">
      <Card>
        <ProfileHeader />
        <div className="card-body">
          <BioBlock />
          <ToolsShowcase />
          <ConnectCTA />
        </div>
      </Card>
    </main>
  );
}
