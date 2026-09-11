// ============================================
// WHAT THIS FILE DOES (plain English):
// The traffic cop for profile-photo looks. Given a photo and the currently
// picked filter, it shows the right version of the photo right away:
//   - Pop art: the 4-tile Warhol grid (instant).
//   - Comic / X-ray / Sepia: stay on the on-device color matrix. The saved
//     avatar may still bake on our server later (ImageMagick, not AI). The
//     picker itself never waits on that, so the "ran locally" line stays true.
// ============================================
import React from 'react';
import { Image, View } from 'react-native';
import type { PhotoFilterKey } from '../PhotoFilterPicker';
import type { ServerPhotoFilter } from '../../../lib/photo-filters';
import { LiveFilterPreview } from './LiveFilterPreview';
import { WarholPhoto } from './WarholPhoto';

/** Full-bleed style so any look fills the square photo well. */
const FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%' as const,
  height: '100%' as const
};

/** Looks that are painted on the server (all four). Pop art still previews live. */
const SERVER_FILTERS = new Set<PhotoFilterKey>([
  'pop_art',
  'comic',
  'x_ray',
  'sepia'
]);

export function FilteredPhoto({
  uri,
  filter,
  accessibilityLabel
}: {
  uri: string;
  filter: PhotoFilterKey;
  /** Kept so older call sites still compile. The picker paints on-device. */
  bakedUrl?: string | null;
  /** Kept so older call sites still compile. The picker does not wait on bake. */
  bakedLoading?: boolean;
  accessibilityLabel?: string;
}) {
  // THIS SECTION DOES: Pop art keeps the instant Warhol grid. Comic / X-ray /
  // Sepia stay on the on-device matrix so the picker never looks like AI.
  if (filter === 'pop_art') {
    return (
      <View style={FILL}>
        <WarholPhoto uri={uri} />
      </View>
    );
  }

  if (SERVER_FILTERS.has(filter)) {
    return (
      <View style={FILL}>
        <LiveFilterPreview uri={uri} filter={filter} />
      </View>
    );
  }

  // THIS SECTION DOES: every other look falls back to the untouched photo for now.
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={accessibilityLabel}
      resizeMode="cover"
      style={FILL}
    />
  );
}

/** True when this filter key is baked on the server for the saved avatar. */
export function isServerPhotoFilter(
  filter: PhotoFilterKey
): filter is ServerPhotoFilter {
  return (
    filter === 'pop_art' ||
    filter === 'comic' ||
    filter === 'x_ray' ||
    filter === 'sepia'
  );
}
