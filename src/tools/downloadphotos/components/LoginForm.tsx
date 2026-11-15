import { useRef, useState, type FormEvent } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '../../../design-system/primitives/Card';
import { Heading } from '../../../design-system/primitives/Heading';
import { Text } from '../../../design-system/primitives/Text';
import { Button } from '../../../design-system/primitives/Button';
import { login, type LoginResult } from '../api';

// TextInput forwards unknown props to the <input>, but its type omits autoComplete.
const autoComplete = (value: string) => ({ autoComplete: value }) as object;

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="M2 2l20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function LoginForm({ onSignedIn }: { onSignedIn: (r: LoginResult) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pwRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError('Enter your ChildFirst username and password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const r = await login(username, password);
      setPassword('');
      setShowPw(false);
      if (!r.children.length) setError('No children found on this account.');
      else onSignedIn(r);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <Card className="cf-login">
      <form className="cf-login-body" onSubmit={submit} autoComplete="on" noValidate>
        <Heading level={1}>ChildFirst Photo Export</Heading>
        <Text variant="secondary">Download your own child's photos from the ChildFirst / Taidii app.</Text>
        <TextInput
          label="Username or email"
          value={username}
          onChange={setUsername}
          htmlName="username"
          size="lg"
          className="cf-input"
          isRequired
          {...autoComplete('username')}
        />
        <div className="cf-password">
          <TextInput
            ref={pwRef}
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            htmlName="password"
            size="lg"
            className="cf-input cf-input--with-toggle"
            isRequired
            {...autoComplete('current-password')}
          />
          <button
            type="button"
            className="cf-pw-toggle"
            aria-label={showPw ? 'Hide password' : 'Show password'}
            aria-pressed={showPw}
            title={showPw ? 'Hide password' : 'Show password'}
            // keep focus (and the caret) in the password field when toggled with a pointer
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowPw((s) => !s);
              pwRef.current?.focus();
            }}
          >
            <EyeIcon off={showPw} />
          </button>
        </div>
        <Button type="submit" size="lg" className="cf-login-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        {error && <Banner status="error" title={error} role="alert" />}
        <Text variant="secondary" className="cf-note">
          <strong>Your password never reaches this website.</strong> This page runs entirely in your browser and
          talks directly to ChildFirst's servers over HTTPS — the same way the app does. Nothing is stored or logged
          here. This is an independent tool for exporting your own data; it is not affiliated with, endorsed by, or
          connected to ChildFirst or Taidii. Use at your own risk.
        </Text>
      </form>
    </Card>
  );
}
