// ============================================
// WHAT THIS FILE DOES (plain English):
// A thin wrapper around Avatar that looks up the person by id and, if you
// dropped a profile photo into assets/demo/profile-pics/, shows that photo
// instead of their emoji. Use this anywhere you already have a person id.
// ============================================
import React from 'react';
import type { Accent } from '@bridger/shared';
import { Avatar } from '@bridger/ui';
import { getProfilePhoto } from '../data/fixtures/demo-media';
import { personById } from '../data/people';

export function PersonAvatar({
  id,
  size = 'md',
  story,
  onStory,
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
  className?: string;
  name?: string;
  emoji?: string;
  accent?: Accent;
}) {
  const p = personById(id);
  return (
    <Avatar
      name={name ?? p.name}
      emoji={emoji ?? p.emoji}
      accent={accent ?? p.accent}
      photo={getProfilePhoto(id)}
      size={size}
      story={story ?? p.story}
      onStory={onStory}
      className={className}
    />
  );
}
