// ============================================
// WHAT THIS FILE DOES (plain English):
// The little tray behind the sparkle icon on the camera screen. It holds the
// three dashed "themed post" squares (OOTD, Take 0.5, Hot take...) and, as its
// footer, the BeReal-like reminders switch. They used to sit under the camera
// all the time; now they are one tap away so the camera can be the whole
// screen. Same prefs, same analytics ids as before.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ThemedPrompt } from '@bridger/shared';
import { POST_COMPOSER, PROMPTS_TRAY } from '@bridger/shared';
import { AnalyticsRegion, Sheet, Toggle, cn, withAnalyticsPress } from '@bridger/ui';

type Props = {
  open: boolean;
  onClose: () => void;
  prompts: ThemedPrompt[];
  theme: string | null;
  onTheme: (slug: string | null) => void;
  randomNudges: boolean;
  onToggleNudges: (on: boolean) => void;
};

export function PromptsTray({
  open,
  onClose,
  prompts,
  theme,
  onTheme,
  randomNudges,
  onToggleNudges
}: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Themed posts"
      surface="prompts_tray"
      parentScreen="post_composer"
      dismissAnalyticsId={PROMPTS_TRAY.tray.dismiss}
    >
      {/* THIS SECTION DOES: the three dashed squares. Tap one to label the post. */}
      <View className="flex-row gap-2.5">
        {prompts.map((t) => {
          const on = theme === t.slug;
          return (
            <Pressable
              key={t.slug}
              onPress={withAnalyticsPress(POST_COMPOSER.suggested.suggested_prompt, () => {
                onTheme(on ? null : t.slug);
              })}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              className={cn(
                'min-h-[64px] flex-1 items-center justify-center gap-1 border-2 border-dashed px-2 py-3',
                on ? 'border-ink bg-ink/10' : 'border-ink-line'
              )}
            >
              <Text accessible={false} className="text-[20px]">
                {t.icon}
              </Text>
              <Text className={cn('font-sans-b text-[11px]', on ? 'text-ink' : 'text-ink-soft')}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* THIS SECTION DOES: opt into BeReal-like capture reminders (1 to 3 a day). */}
      <View className="mt-4 flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3 py-3">
        <AnalyticsRegion
          analyticsId={POST_COMPOSER.suggested.random_nudges_label}
          interactive={false}
          className="min-w-0 flex-1"
        >
          <Text className="font-sans-b text-[13px] text-ink">BeReal-like reminders</Text>
          <Text className="mt-0.5 font-sans-md text-[11px] leading-snug text-ink-mute">
            Random reminders to capture your life. 1 to 3 a day, including a mid-party
            nudge when you are at an event.
          </Text>
        </AnalyticsRegion>
        <Toggle
          checked={randomNudges}
          onChange={onToggleNudges}
          label="BeReal-like reminders, 1 to 3 notifications a day"
          analyticsId={POST_COMPOSER.suggested.random_nudges_toggle}
        />
      </View>
    </Sheet>
  );
}
