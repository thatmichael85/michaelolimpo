import { lazy, Suspense } from 'react';
import { Card } from '../design-system/primitives/Card';
import { ProfileHeader } from '../components/landing/ProfileHeader';
import { BioBlock } from '../components/landing/BioBlock';
import { ConnectCTA } from '../components/landing/ConnectCTA';
import { ToolsShowcase } from '../components/landing/ToolsShowcase';
import { useNanoAvailability } from '../components/chat/useNanoAvailability';

// Separate chunk: only fetched by visitors whose Chrome can run Gemini Nano.
const ChatPanel = lazy(() => import('../components/chat/ChatPanel'));

export function LandingPage() {
  const nano = useNanoAvailability();
  const showChat = nano !== 'checking' && nano !== 'unavailable';

  return (
    <main className={`landing-wrapper${showChat ? ' landing-wrapper--with-chat' : ''}`}>
      <Card>
        <ProfileHeader />
        <div className="card-body">
          <BioBlock />
          <ToolsShowcase />
          <ConnectCTA />
        </div>
      </Card>
      {showChat && (
        <div className="chat-column">
          <Suspense fallback={null}>
            <ChatPanel availability={nano} />
          </Suspense>
        </div>
      )}
    </main>
  );
}
