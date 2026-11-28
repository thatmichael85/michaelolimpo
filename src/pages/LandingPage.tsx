import { lazy, Suspense, useRef, useState } from 'react';
import { Card } from '../design-system/primitives/Card';
import { ProfileHeader } from '../components/landing/ProfileHeader';
import { BioBlock } from '../components/landing/BioBlock';
import { ConnectCTA } from '../components/landing/ConnectCTA';
import { ToolsShowcase } from '../components/landing/ToolsShowcase';
import { useNanoAvailability } from '../components/chat/useNanoAvailability';
import { ChatErrorBoundary } from '../components/chat/ChatErrorBoundary';
import { useSlideOnChange } from '../components/chat/useSlideOnChange';

// Separate chunk: only fetched by visitors whose Chrome can run Gemini Nano.
const ChatPanel = lazy(() => import('../components/chat/ChatPanel'));

export function LandingPage() {
  const nano = useNanoAvailability();
  const [chatFailed, setChatFailed] = useState(false);
  const showChat = nano !== 'checking' && nano !== 'unavailable' && !chatFailed;
  const profileRef = useRef<HTMLDivElement>(null);
  useSlideOnChange(profileRef, showChat);

  return (
    <main className={`landing-wrapper${showChat ? ' landing-wrapper--with-chat' : ''}`}>
      <div ref={profileRef} className="profile-column">
        <Card>
          <ProfileHeader />
          <div className="card-body">
            <BioBlock />
            <ToolsShowcase />
            <ConnectCTA />
          </div>
        </Card>
      </div>
      {showChat && (
        <div className="chat-column">
          <ChatErrorBoundary onError={() => setChatFailed(true)}>
            <Suspense fallback={null}>
              <ChatPanel availability={nano} />
            </Suspense>
          </ChatErrorBoundary>
        </div>
      )}
    </main>
  );
}
