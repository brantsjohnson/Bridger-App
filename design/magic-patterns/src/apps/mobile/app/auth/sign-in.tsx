// ============================================
// WHAT THIS FILE DOES (plain English):
// Magic Patterns reference for the branded Sign in screen: color-bar
// background, Bridger mark centered, auth controls in the lower panel.
// The live React Native screen is apps/mobile/app/(auth)/sign-in.tsx.
// ============================================
import { ButtonPrimary, ButtonSecondary, PixelHeading, Screen } from '../../../../packages/ui';

/** Branded Sign in — logo long-press unlocks demo in preview builds. */
export function SignInScreen({
  onSignIn,
  onSignUp,
  onDemo
}: {
  onSignIn?: () => void;
  onSignUp?: () => void;
  onDemo?: () => void;
}) {
  return (
    <Screen tone="plain">
      <div
        className="relative flex min-h-full flex-1 flex-col"
        style={{
          backgroundImage: 'url(/brand/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* THIS SECTION DOES: put the Bridger mark in the middle of the screen. */}
        <div className="flex flex-1 items-center justify-center px-8 pt-10">
          <button
            type="button"
            className="border-0 bg-transparent p-0"
            aria-label="Bridger logo"
            title="Hold to enter demo"
            onContextMenu={(e) => {
              e.preventDefault();
              onDemo?.();
            }}
          >
            <img
              src="/brand/bridger-mark.png"
              alt=""
              className="h-52 w-40 object-contain"
            />
          </button>
        </div>

        {/* THIS SECTION DOES: keep login controls readable on a lower panel. */}
        <div className="rounded-t-3xl bg-canvas px-5 pb-10 pt-5">
          <PixelHeading as="h1" size="md" className="mb-3">
            Sign in
          </PixelHeading>
          <div className="flex flex-col gap-3">
            <ButtonSecondary full size="lg">
              Continue with Google
            </ButtonSecondary>
            <ButtonSecondary full size="lg">
              Continue with Apple
            </ButtonSecondary>
            <ButtonPrimary full size="lg" onClick={onSignIn}>
              Sign in
            </ButtonPrimary>
            <ButtonSecondary full tone="ghost" onClick={onSignUp}>
              Create account
            </ButtonSecondary>
          </div>
        </div>
      </div>
    </Screen>
  );
}
