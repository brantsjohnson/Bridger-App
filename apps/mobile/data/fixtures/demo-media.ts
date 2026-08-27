// ============================================
// WHAT THIS FILE DOES (plain English):
// Looks up demo profile photos and story media you dropped into
// apps/mobile/assets/demo/. The generated file is rebuilt by
// scripts/sync-demo-media.mjs after you add or replace files.
// ============================================
import type { ImageSourcePropType } from 'react-native';
import {
  PROFILE_PHOTOS,
  STORY_MEDIA,
  type DemoStoryMedia
} from './demo-media.generated';

export type { DemoStoryMedia };

/** Profile photo for a person id, if one was dropped in. */
export function getProfilePhoto(personId: string): ImageSourcePropType | undefined {
  return PROFILE_PHOTOS[personId];
}

/** Story media files dropped in for one author (alphabetical order). */
export function getStoryMedia(authorId: string): DemoStoryMedia[] {
  return STORY_MEDIA[authorId] ?? [];
}

/**
 * A demo circle-video reply clip for this person.
 * Prefers a video they dropped in their stories folder; if they only have
 * photos, falls back to any demo video so the reply still shows a real clip
 * instead of the empty purple badge.
 */
export function getDemoReplyVideo(authorId: string): ImageSourcePropType | undefined {
  const ownVideo = getStoryMedia(authorId).find((m) => m.type === 'video');
  if (ownVideo) return ownVideo.source;
  for (const media of Object.values(STORY_MEDIA)) {
    const clip = media?.find((m) => m.type === 'video');
    if (clip) return clip.source;
  }
  return undefined;
}

/**
 * A still frame to show on a circle-video reply before / instead of playback.
 * Uses that person's first story photo when they have one.
 */
export function getDemoReplyPoster(authorId: string): ImageSourcePropType | undefined {
  const ownPhoto = getStoryMedia(authorId).find((m) => m.type === 'photo');
  return ownPhoto?.source ?? getProfilePhoto(authorId);
}
