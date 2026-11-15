import { useCallback, useState } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '../../../design-system/theme';
import { ThemeToggle } from '../../../components/layout/ThemeToggle';
import { useThemePreference } from '../../../utils/useThemePreference';
import { clearSession, loadSession, saveSession, type Session } from '../session';
import { LoginForm } from './LoginForm';
import { PhotoApp } from './PhotoApp';
import { PrivacyNotice, SOURCE_URL } from './PrivacyNotice';

export function DownloadPhotos() {
  const { preference, resolvedTheme, toggleTheme } = useThemePreference();
  // Restore a prior session (survives refresh, not tab close). An expired token
  // falls back to the login screen via the 401 handling in the gallery.
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return (
    <Theme theme={neutralTheme} mode={resolvedTheme}>
      <ThemeToggle preference={preference} resolvedTheme={resolvedTheme} onToggleTheme={toggleTheme} />
      <div className="cf-wrap">
        <div className="cf-topbar">
          <a className="cf-home" href="/">mikeosoft.ai</a>
          <span aria-hidden="true">/</span>
          <span>tools</span>
        </div>
        <PrivacyNotice />
        <main>
          {session ? (
            <PhotoApp token={session.token} childList={session.children} onSignOut={signOut} />
          ) : (
            <LoginForm
              onSignedIn={(r) => {
                saveSession(r);
                setSession(r);
              }}
            />
          )}
        </main>
        <footer className="cf-footer">
          Runs 100% in your browser ·{' '}
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">open source</a> · exports your own data only.
        </footer>
      </div>
    </Theme>
  );
}
