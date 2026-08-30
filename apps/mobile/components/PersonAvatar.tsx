// ============================================
// WHAT THIS FILE DOES (plain English):
// A thin wrapper around Avatar that looks up the person by id and shows their
// real profile photo when we have one (live signed URL, or a demo fixture).
// Use this anywhere you already have a person id.
// ============================================
import React from 'react';
import type { Accent } from '@bridger/shared';
import { Avatar, type WashStoryRing } from '@bridger/ui';
import { avatarPhotoFor } from '../lib/avatar-photo';
import { personById } from '../data/people';

export function PersonAvatar({
  id,
  size = 'md',
  story,
  onStory,
  ringWash,
  className,
  /** Override the looked-up person (rarely needed) */
  name,
  emoji,
  accent
}: {
  id: string;
  size?: 'xs' | 'sm' | 'header' | 'md' | 'lg' | 'xl';
  story?: 'unseen' | 'seen';
  onStory?: () => void;
  ringWash?: WashStoryRing;
  className?: string;
  name?: string;
  emoji?: string;
  accent?: Accent;
}) {
  const p = personById(id);
  // Match the Friends roster wash when the caller didn't pick one.
  const wash: WashStoryRing =
    ringWash ??
    (p.tier === 'close' ? 'close' : p.tier === 'acquaintance' ? 'acquaintance' : 'friend');
  return (
    <Avatar
      name={name ?? p.name}
      emoji={emoji ?? p.emoji}
      accent={accent ?? p.accent}
      personId={id}
      photo={avatarPhotoFor(id, p.avatarUrl)}
      size={size}
      story={story ?? p.story}
      ringWash={wash}
      onStory={onStory}
      className={className}
    />
  );
}
