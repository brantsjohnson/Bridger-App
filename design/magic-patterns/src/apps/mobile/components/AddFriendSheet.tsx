import React from 'react';
import { LinkIcon, ScanLineIcon } from 'lucide-react';
import { ButtonSecondary, Sheet } from '../../../packages/ui';
import { QrBlock } from './ColdStart';

/** Both doors are instant — no request, no accept. QR shows immediately. */
export function AddFriendSheet({
  open,
  onClose,
  onScan




}: {open: boolean;onClose: () => void;onScan?: () => void;}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a friend"
      footer={
      <ButtonSecondary
        full
        size="md"
        tone="solid"
        icon={<LinkIcon className="h-4 w-4" strokeWidth={2.5} />}
        onClick={onClose}>
        
          Share invite link
        </ButtonSecondary>
      }>
      
      <div className="space-y-4">
        <QrBlock />
        <p className="text-center text-[12px] font-semibold text-ink-mute">
          Let them scan this
        </p>
        <ButtonSecondary
          full
          size="md"
          icon={<ScanLineIcon className="h-4 w-4" strokeWidth={2.4} />}
          onClick={onScan}>
          
          Scan a code
        </ButtonSecondary>
      </div>
    </Sheet>);

}