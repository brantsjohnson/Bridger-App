// ============================================
// WHAT THIS FILE DOES (plain English):
// One quick re-check when a profile fact looks stale ("Still into beatboxing?").
// Yes keeps it, Not anymore removes it, X just closes the card with no change.
//
// Analytics:
//   Yes → click quick_check_yes + product quick_check_kept
//   Not anymore → click quick_check_edit + product quick_check_removed
//   X → click quick_check_dismiss (no product event; nothing changed)
//   Question body / result banner → dead_click (interactive:false)
// PRIVACY: never log the question text.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { HOME, trackProduct } from '@bridger/shared';
import { AnalyticsRegion, ButtonSecondary, ORGANIC, withAnalyticsPress } from '@bridger/ui';

export function FreshnessCard({
  question = 'Still into beatboxing?',
  onDismiss
}: {
  question?: string;
  /** X: remove the card from the carousel (no "kept" / "removed" message). */
  onDismiss?: () => void;
}) {
  // THIS SECTION DOES: track which face of the card we are showing.
  const [state, setState] = useState<'ask' | 'kept' | 'gone' | 'dismissed'>('ask');

  // THIS SECTION DOES: X left with no answer — hide the card entirely.
  if (state === 'dismissed') return null;

  // THIS SECTION DOES: after Yes / Not anymore, show a short confirmation.
  // Taps here are dead_clicks so we learn if people expect more.
  if (state !== 'ask') {
    return (
      <AnalyticsRegion
        analyticsId={HOME.announcements.quick_check_result}
        interactive={false}
        style={ORGANIC.soft}
        className="min-h-[124px] justify-center bg-green px-5 py-4"
      >
        {/* onaccent = always-dark type. On a colored card we never use `text-ink`,
            because that flips to white in dark mode and vanishes. */}
        <Text className="font-sans-b text-[14px] text-onaccent">
          {state === 'kept' ? 'Kept it.' : 'Removed. Thanks for the update.'}
        </Text>
      </AnalyticsRegion>
    );
  }

  // THIS SECTION DOES: the ask face — question + Yes / Not anymore / X.
  return (
    <View style={ORGANIC.soft} className="relative min-h-[124px] bg-amber px-5 py-4">
      {/* THIS SECTION DOES: X closes with no answer (dismiss only). */}
      <Pressable
        onPress={withAnalyticsPress(HOME.announcements.quick_check_dismiss, () => {
          setState('dismissed');
          onDismiss?.();
        })}
        accessibilityRole="button"
        accessibilityLabel="Dismiss quick check"
        className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-white/25"
      >
        {/* onaccent = always-dark type, which is what stays readable on the
            bright amber in both light and dark mode. */}
        <XIcon size={16} color="#1C1B16" strokeWidth={2.6} />
      </Pressable>

      {/* THIS SECTION DOES: the question body — not a button; dead_click if tapped. */}
      <AnalyticsRegion analyticsId={HOME.announcements.quick_check_body} interactive={false}>
        <Text className="font-sans-b text-[11px] uppercase tracking-wide text-onaccent/70">
          Quick check
        </Text>
        <Text className="mt-1 pr-8 font-sans-b text-[16px] leading-snug tracking-tight text-onaccent">
          {question}
        </Text>
      </AnalyticsRegion>

      {/* THIS SECTION DOES: the two answer buttons. */}
      <View className="mt-3 flex-row gap-2.5">
        <View className="flex-1">
          {/* Analytics: UI click + product outcome (kept). Never the question text. */}
          <ButtonSecondary
            full
            size="sm"
            tone="positive"
            onPress={() => {
              setState('kept');
              trackProduct('quick_check_kept');
            }}
            analyticsId={HOME.announcements.quick_check_yes}
          >
            Yes
          </ButtonSecondary>
        </View>
        <View className="flex-1">
          {/* Analytics: UI click + product outcome (removed). Never the question text. */}
          <ButtonSecondary
            full
            size="sm"
            onPress={() => {
              setState('gone');
              trackProduct('quick_check_removed');
            }}
            analyticsId={HOME.announcements.quick_check_edit}
          >
            Not anymore
          </ButtonSecondary>
        </View>
      </View>
    </View>
  );
}
