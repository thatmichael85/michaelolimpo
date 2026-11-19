import { useState } from 'react';
import { enterFullscreen, exitFullscreen } from '../fullscreen';
import { useSettings } from '../useSettings';
import { PlayView } from './PlayView';
import { SetupPage } from './SetupPage';

export function MarqueeApp() {
  const api = useSettings();
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <PlayView
        settings={api.settings}
        onExit={() => {
          exitFullscreen();
          setPlaying(false);
        }}
      />
    );
  }
  return (
    <SetupPage
      {...api}
      onPlay={() => {
        enterFullscreen();
        setPlaying(true);
      }}
    />
  );
}
