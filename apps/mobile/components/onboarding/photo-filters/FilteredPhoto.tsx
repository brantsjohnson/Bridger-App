// ============================================
// WHAT THIS FILE DOES (plain English):
// The traffic cop for profile-photo looks. Given a photo and the currently
// picked filter, it shows the right version of the photo:
//   - Pop art: the 4-tile Warhol grid draws instantly on the phone as a preview
//     while the server bakes a single-tile pop JPEG for the saved avatar.
//   - Comic / X-ray / Sepia: rendered on the server; while we wait we show a
//     spinner, then the finished picture; if it fails we fall back to plain.
//
// It always fills the square box it sits inside, so it drops straight into the
// photo well on the Confirm your details step.
// ============================================
import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { OB } from '../onboarding-theme';
import type { PhotoFilterKey } from '../PhotoFilterPicker';
import type { ServerPhotoFilter } from '../../../lib/photo-filters';
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
  bakedUrl,
  bakedLoading,
  accessibilityLabel
}: {
  uri: string;
  filter: PhotoFilterKey;
  /** Server-rendered preview link, once ready (Comic, X-ray, Sepia, Pop art). */
  bakedUrl?: string | null;
  /** True while the server is rendering a server-side look. */
  bakedLoading?: boolean;
  accessibilityLabel?: string;
}) {
  // THIS SECTION DOES: Pop art keeps the instant Warhol grid as the onboarding
  // preview. The server bake (single-tile pop) is what becomes the avatar.
  if (filter === 'pop_art') {
    return <WarholPhoto uri={uri} />;
  }

  // THIS SECTION DOES: Comic, X-ray, or Sepia, all rendered on the server.
  if (SERVER_FILTERS.has(filter)) {
    if (bakedLoading) {
      return (
        <View style={[FILL, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color={OB.navy} />
        </View>
      );
    }
    if (bakedUrl) {
      return (
        <Image
          source={{ uri: bakedUrl }}
          accessibilityLabel={accessibilityLabel}
          resizeMode="cover"
          style={FILL}
        />
      );
    }
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={accessibilityLabel}
        resizeMode="cover"
        style={FILL}
      />
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
