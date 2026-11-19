import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts (latin only) so the sign works with no signal at the venue.
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/anton/latin-400.css';
import '@fontsource/bungee/latin-400.css';
import '@fontsource/monoton/latin-400.css';
import '@fontsource/pacifico/latin-400.css';
import '@fontsource/press-start-2p/latin-400.css';
import './marquee.css';
import { MarqueeApp } from './components/MarqueeApp';
import { registerMarqueeSW } from './pwa';

registerMarqueeSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MarqueeApp />
  </StrictMode>,
);
