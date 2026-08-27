// ============================================
// WHAT THIS FILE DOES (plain English):
// The "do you want to end this quiz?" sheet. The X mid-quiz opens this instead
// of leaving right away. End quiz leaves. Keep going stays. Answers are not
// saved if they leave. This is its own analytics surface (end_quiz_sheet).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { END_QUIZ_SHEET } from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, ButtonSecondary, Sheet } from '@bridger/ui';

export function EndQuizSheet({
  open,
  onStay,
  onEnd,
  parentScreen = 'quiz'
}: {
  open: boolean;
  onStay: () => void;
  onEnd: () => void;
  parentScreen?: string;
}) {
  return (
    <Sheet
      open={open}
      onClose={onStay}
      title="End quiz?"
      surface="end_quiz_sheet"
      parentScreen={parentScreen}
      dismissAnalyticsId={END_QUIZ_SHEET.dismiss}
      footer={
        <View className="gap-2.5">
          <ButtonPrimary
            full
            analyticsId={END_QUIZ_SHEET.end}
            onPress={onEnd}
            accessibilityLabel="End quiz"
          >
            End quiz
          </ButtonPrimary>
          <ButtonSecondary
            full
            analyticsId={END_QUIZ_SHEET.stay}
            onPress={onStay}
            accessibilityLabel="Keep going"
          >
            Keep going
          </ButtonSecondary>
        </View>
      }
    >
      <AnalyticsRegion
        analyticsId={END_QUIZ_SHEET.body}
        interactive={false}
        className="py-1"
        accessibilityLabel="Your answers so far will not be saved."
      >
        <Text className="font-sans-sb text-[15px] leading-snug text-ink-soft">
          Your answers so far will not be saved.
        </Text>
      </AnalyticsRegion>
    </Sheet>
  );
}
