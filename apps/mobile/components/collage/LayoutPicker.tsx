// ============================================
// WHAT THIS FILE DOES (plain English):
// Swap the photo arrangement. Same five families as today, shown as little
// page thumbs. Tap one and the photos jump into place.
// ============================================
import React from 'react';
import { COLLAGE_LAYOUTS } from '@bridger/shared';
import { LayoutCarousel, Sheet } from '@bridger/ui';
import type { useScrapbookDraft } from '../../hooks/useScrapbookDraft';

export function LayoutPicker({
  open,
  onClose,
  draft
}: {
  open: boolean;
  onClose: () => void;
  draft: ReturnType<typeof useScrapbookDraft>;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Pick a layout"
      surface="collage_layouts"
      parentScreen="collage_editor"
      dismissAnalyticsId={COLLAGE_LAYOUTS.chrome.dismiss}
    >
      {draft.mediaCount === 0 ? (
        null
      ) : (
        <LayoutCarousel
          layouts={draft.layouts}
          selectedId={draft.page.layoutId}
          onSelect={(t) => draft.setLayout(t)}
          analyticsId={COLLAGE_LAYOUTS.list.thumb}
        />
      )}
    </Sheet>
  );
}
