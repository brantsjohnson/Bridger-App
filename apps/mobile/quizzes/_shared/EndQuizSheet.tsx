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
  onDiscard,
  parentScreen = 'quiz',
  /** When true, leaving keeps a local draft so they can resume. */
  canSaveDraft = false
}: {
  open: boolean;
  onStay: () => void;
  onEnd: () => void;
  /** Optional wipe-and-leave (Discover quizzes with on-device drafts). */
  onDiscard?: () => void;
  parentScreen?: string;
  canSaveDraft?: boolean;
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
            accessibilityLabel={canSaveDraft ? 'Save and exit' : 'End quiz'}
          >
            {canSaveDraft ? 'Save and exit' : 'End quiz'}
          </ButtonPrimary>
          <ButtonSecondary
            full
            analyticsId={END_QUIZ_SHEET.stay}
            onPress={onStay}
            accessibilityLabel="Keep going"
          >
            Keep going
          </ButtonSecondary>
          {canSaveDraft && onDiscard ? (
            <ButtonSecondary
              full
              analyticsId={END_QUIZ_SHEET.dismiss}
              onPress={onDiscard}
              accessibilityLabel="Discard progress and exit"
            >
              Discard and exit
            </ButtonSecondary>
          ) : null}
        </View>
      }
    >
      <AnalyticsRegion
        analyticsId={END_QUIZ_SHEET.body}
        interactive={false}
        className="py-1"
        accessibilityLabel={
          canSaveDraft
            ? 'Your progress is saved on this phone. You can come back and finish later.'
            : 'Your answers so far will not be saved.'
        }
      >
        <Text className="font-sans-sb text-[15px] leading-snug text-ink-soft">
          {canSaveDraft
            ? 'Your progress is saved on this phone. You can come back and finish later.'
            : 'Your answers so far will not be saved.'}
        </Text>
      </AnalyticsRegion>
    </Sheet>
  );
}
