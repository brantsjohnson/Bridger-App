import React from 'react';
import {
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  TextField } from
'../../../../packages/ui';

/** Phase 1 — create account. Email · Google · Apple. */
export function SignUpScreen({
  onDone,
  onSignIn



}: {onDone?: () => void;onSignIn?: () => void;}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <Screen>
      <div className="px-5 pb-2 pt-8">
        <PixelHeading as="h1" size="lg">
          Create account
        </PixelHeading>
      </div>
      <ScreenBody className="pb-6">
        <div className="mt-4 space-y-3">
          <ButtonSecondary full size="lg">
            Continue with Google
          </ButtonSecondary>
          <ButtonSecondary full size="lg">
            Continue with Apple
          </ButtonSecondary>
        </div>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink-line" />
          <span className="text-[12px] font-bold text-ink-mute">or</span>
          <span className="h-px flex-1 bg-ink-line" />
        </div>

        <div className="space-y-3">
          <TextField label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
          <TextField label="Password" value={password} onChange={setPassword} type="password" placeholder="8+ characters" />
        </div>

        <div className="mt-6 space-y-2.5">
          <ButtonSecondary full size="lg" tone="solid" onClick={onDone}>
            Create account
          </ButtonSecondary>
          <ButtonSecondary full tone="ghost" onClick={onSignIn}>
            Sign in
          </ButtonSecondary>
        </div>
      </ScreenBody>
    </Screen>);

}