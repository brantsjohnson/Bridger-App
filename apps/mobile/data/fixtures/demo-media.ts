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
