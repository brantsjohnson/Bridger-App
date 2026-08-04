import React from 'react';
import { LinkIcon, QrCodeIcon, ScanLineIcon } from 'lucide-react';
import { ButtonSecondary, Card, PixelHeading } from '../../../packages/ui';

/** Shared cold start — same invitation on Home and Friends. */
export function ColdStart({ onAdd }: {onAdd?: () => void;}) {
  return (
    <Card className="text-center">
      <span aria-hidden="true" className="text-[30px]">
        🌉
      </span>
      <PixelHeading size="md" className="mt-3">
        Bring your people in
      </PixelHeading>
      <div className="mt-5 space-y-2.5">
        <ButtonSecondary
          full
          size="md"
          tone="solid"
          icon={<LinkIcon className="h-4 w-4" strokeWidth={2.5} />}
          onClick={onAdd}>
          
          Share invite link
        </ButtonSecondary>
        <ButtonSecondary full icon={<QrCodeIcon className="h-4 w-4" strokeWidth={2.4} />} onClick={onAdd}>
          Your QR code
        </ButtonSecondary>
        <ButtonSecondary full icon={<ScanLineIcon className="h-4 w-4" strokeWidth={2.4} />} onClick={onAdd}>
          Scan a code
        </ButtonSecondary>
      </div>
    </Card>);

}

export function QrBlock() {
  return (
    <div
      aria-label="Your QR code"
      role="img"
      className="mx-auto grid h-40 w-40 grid-cols-8 gap-0.5 rounded-none border-2 border-ink bg-white p-2">
      
      {Array.from({ length: 64 }).map((_, i) =>
      <span key={i} className={i % 3 === 0 || i % 5 === 0 ? 'bg-ink' : 'bg-transparent'} />
      )}
    </div>);

}