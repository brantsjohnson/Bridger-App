// ============================================
// WHAT THIS FILE DOES (plain English):
// Magic Patterns reference for the 404 popup: old-Windows chrome that says
// "Error 404" / "You're invited to suffer" with an OK button and the
// classic yellow warning triangle. The live screen is packages/ui NotFoundScreen.
// ============================================
import {
  Screen,
  WindowsButton,
  WindowsDialog
} from '../../../packages/ui';

/** 404. Old-Windows popup, square and beveled. */
export function NotFoundScreen({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center px-6">
        <WindowsDialog title="Error 404" onClose={onDismiss}>
          <div className="flex items-center gap-3.5">
            {/* Classic Windows warning: yellow triangle with a black !. */}
            <span
              aria-hidden="true"
              className="relative inline-flex h-9 w-10 items-center justify-center"
            >
              <span
                className="absolute"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '18px solid transparent',
                  borderRight: '18px solid transparent',
                  borderBottom: '32px solid #F5C518'
                }}
              />
              <span className="relative z-10 text-[16px] font-black leading-none text-ink">
                !
              </span>
            </span>
            <p className="font-pixel text-[17px] leading-tight text-ink">
              You're invited to suffer
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <WindowsButton autoFocusRing onClick={onDismiss}>
              OK
            </WindowsButton>
          </div>
        </WindowsDialog>
      </div>
    </Screen>
  );
}
