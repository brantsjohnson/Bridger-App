import React from 'react';
import { XIcon } from 'lucide-react';
import {
  Screen,
  WindowsButton,
  WindowsDialog } from
'../../../packages/ui';

/** 404. Old-Windows popup, square and beveled. */
export function NotFoundScreen({ onDismiss }: {onDismiss?: () => void;}) {
  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center px-6">
        <WindowsDialog title="Error 404" onClose={onDismiss}>
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              
              <XIcon className="h-5 w-5" strokeWidth={4} />
            </span>
            <p className="font-pixel text-[19px] leading-tight text-ink">Fucks not found.</p>
          </div>
          <div className="mt-6 flex justify-center">
            <WindowsButton autoFocusRing onClick={onDismiss}>
              OK
            </WindowsButton>
          </div>
        </WindowsDialog>
      </div>
    </Screen>);

}