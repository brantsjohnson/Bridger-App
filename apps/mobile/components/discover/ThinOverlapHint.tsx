// ============================================
// WHAT THIS FILE DOES (plain English):
// The helpful empty for Connection Reveal and In common when two people
// have not filled enough to compare yet. It does not invent overlap. It
// points them to Personality quizzes on Discover. Adding a friend is never
// blocked. Each person still only sees what the other labeled for the
// circle they were placed in.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import {
  AnalyticsRegion,
  ButtonPrimary,
  EmptyState,
  useResponsiveLayout
} from '@bridger/ui';

// THIS SECTION DOES: the two short empty-state sentences (reveal vs In common).
/** Short line for the dark reveal story card. */
export function thinOverlapRevealLine(firstName: string): string {
  return `Head to Discover and take a personality quiz, or add a hobby you both share. In common on ${firstName}'s profile fills in once you share something at this circle.`;
}

/** Longer line for the In common tab (eggshell page). */
export function thinOverlapInCommonLine(firstName: string): string {
  return `Nothing shared with ${firstName} yet at this circle. Take a personality quiz on Discover, or add a hobby or anything you both mark for Acquaintances (or Friends / Close friends, if that is how you placed each other). Each of you only sees what the other person shares with the circle they put you in.`;
}

// THIS SECTION DOES: the dark reveal empty card (button sits in the bottom bar).
/** Dark reveal empty: copy only. The button lives in the bottom bar so story taps do not steal it. */
export function RevealThinOverlapBody({
  firstName,
  bodyAnalyticsId
}: {
  firstName: string;
  bodyAnalyticsId: string;
}) {
  const { contentMaxWidth } = useResponsiveLayout();
  const line = thinOverlapRevealLine(firstName);

  return (
    <View
      className="mt-8 w-full items-center px-2"
      style={{ maxWidth: contentMaxWidth, alignSelf: 'center' }}
    >
      <Text
        className="mb-3 text-center font-sans-b text-[18px]"
        style={{ color: '#F5F0E6' }}
      >
        Nothing to line up yet
      </Text>
      <AnalyticsRegion
        analyticsId={bodyAnalyticsId}
        interactive={false}
        accessibilityLabel={line}
      >
        <Text
          className="text-center font-sans-sb text-[15px] leading-snug"
          style={{ color: 'rgba(245, 240, 230, 0.7)' }}
        >
          {line}
        </Text>
      </AnalyticsRegion>
    </View>
  );
}

// THIS SECTION DOES: the In common empty on a friend profile (eggshell page).
/** In common tab empty: dashed empty + Personality quizzes button. */
export function InCommonThinOverlap({
  firstName,
  onOpenQuizzes,
  bodyAnalyticsId,
  ctaAnalyticsId
}: {
  firstName: string;
  onOpenQuizzes: () => void;
  bodyAnalyticsId: string;
  ctaAnalyticsId: string;
}) {
  const line = thinOverlapInCommonLine(firstName);

  return (
    <EmptyState
      emoji="✨"
      analyticsId={bodyAnalyticsId}
      line={line}
      action={
        <ButtonPrimary
          analyticsId={ctaAnalyticsId}
          onPress={onOpenQuizzes}
          accessibilityLabel="Go to personality quizzes on Discover"
        >
          Personality quizzes
        </ButtonPrimary>
      }
    />
  );
}
