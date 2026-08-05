// ============================================
// WHAT THIS FILE DOES (plain English):
// Split-screen layout for admin pages: your edits on the left, a live phone
// demo on the right so you can see what people will get before you go live.
// ============================================
import type { ReactNode } from 'react';
import { PhoneFrame } from './PhoneFrame';

type Props = {
  title: string;
  description: string;
  /** Editor / forms on the left. */
  children: ReactNode;
  /** Contents of the phone screen on the right. */
  preview: ReactNode;
  /** Label under the phone. */
  previewCaption: string;
};

export function DemoSplit({
  title,
  description,
  children,
  preview,
  previewCaption
}: Props) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="mb-1 font-pixel text-3xl">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* --- Left: what you edit --- */}
        <div className="min-w-0">{children}</div>

        {/* --- Right: sticky phone demo --- */}
        <aside
          className="lg:sticky lg:top-6"
          aria-label="Live demo of how this looks in the app"
        >
          <div className="mb-3 rounded-xl border border-line bg-surface px-3 py-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Live demo
            </p>
            <p className="text-sm text-ink">Updates as you type</p>
          </div>
          <PhoneFrame caption={previewCaption}>{preview}</PhoneFrame>
        </aside>
      </div>
    </div>
  );
}
