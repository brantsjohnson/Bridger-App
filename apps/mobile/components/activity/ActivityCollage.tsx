// ============================================
// WHAT THIS FILE DOES (plain English):
// The body of the weekly activity collage — prompt card, one "Post yours"
// button (metallic, so it stays visible in dark mode), and the 2-column
// polaroid wall. Spec: HOME.md § Weekly activity.
//
// PRIVACY/DESIGN: prompt card stays a light accent tint, so labels use hard
// dark ink — theme text-ink flips cream in dark mode and would vanish.
// ============================================
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { CameraIcon } from 'lucide-react-native';
import { ACTIVITY, HOME } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  ButtonPrimary,
  Chip,
  cn
} from '@bridger/ui';
import type { HomeWeeklyActivity } from '../../data/activity';
import { ActivityPolaroid } from './ActivityPolaroid';

// Hard dark ink on the light prompt tint (same reason as polaroid faces)
const PROMPT_INK = '#1C1B16';
const PROMPT_MUTE = '#5C594E';

type Props = {
  activity: HomeWeeklyActivity;
  heartedIds: Set<string>;
  onRequestCapture: () => void;
  onToggleHeart: (postId: string) => void;
};

export function ActivityCollage({
  activity,
  heartedIds,
  onRequestCapture,
  onToggleHeart
}: Props) {
  const token = ACCENTS[activity.accent] ?? ACCENTS.amber;

  const mine = useMemo(
    () => activity.posts.find((p) => p.personId === 'me') ?? null,
    [activity.posts]
  );
  const others = useMemo(
    () => activity.posts.filter((p) => p.personId !== 'me'),
    [activity.posts]
  );
  const postCount = activity.posts.length;

  return (
    <View>
      {/* Prompt card — what people should post this week */}
      <AnalyticsRegion
        analyticsId={ACTIVITY.prompt.prompt_card}
        interactive={false}
      >
        <View className={cn('rounded-card px-5 py-5', token.tintSolid)}>
          <Text
            className="font-sans-b text-[11px] uppercase tracking-wide"
            style={{ color: PROMPT_MUTE }}
          >
            The prompt
          </Text>
          <Text
            className="mt-1 font-sans-b text-[19px] leading-snug tracking-tight"
            style={{ color: PROMPT_INK }}
          >
            {activity.prompt}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Chip
              label={activity.closesIn}
              size="sm"
              accent={activity.accent}
              selected
            />
            <Chip label={`${postCount} posted`} size="sm" />
          </View>
        </View>
      </AnalyticsRegion>

      {/* One Post yours only — metallic so it never blends into dark canvas */}
      {!mine ? (
        <View className="mt-5">
          <ButtonPrimary
            full
            size="lg"
            icon={
              <CameraIcon size={16} color="#1C1B16" strokeWidth={2.6} />
            }
            analyticsId={HOME.activity.post}
            onPress={onRequestCapture}
            accessibilityLabel="Post yours"
          >
            Post yours
          </ButtonPrimary>
        </View>
      ) : null}

      <View className="mt-5 flex-row flex-wrap justify-between">
        {mine ? (
          <ActivityPolaroid
            postId={mine.id}
            personId="me"
            emoji={mine.emoji}
            caption={mine.caption}
            audience={mine.audience}
            index={0}
            hearted={false}
          />
        ) : null}

        {others.map((post, i) => (
          <ActivityPolaroid
            key={post.id}
            postId={post.id}
            personId={post.personId}
            emoji={post.emoji}
            caption={post.caption}
            audience={post.audience}
            index={mine ? i + 1 : i}
            hearted={heartedIds.has(post.id)}
            onToggleHeart={() => onToggleHeart(post.id)}
          />
        ))}
      </View>

      {postCount === 0 && !mine ? (
        <AnalyticsRegion
          analyticsId={ACTIVITY.grid.empty_body}
          interactive={false}
        >
          <Text className="mt-4 text-center font-sans-sb text-[13px] text-ink-mute">
            Nobody has posted yet. Go first.
          </Text>
        </AnalyticsRegion>
      ) : null}
    </View>
  );
}
